-- Database Functions and Triggers

-- Function to calculate global player leaderboard
CREATE OR REPLACE FUNCTION calculate_global_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER,
  quizzes_played BIGINT,
  avg_score NUMERIC,
  percentile NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_players AS (
    SELECT
      p.id as _id,
      p.display_name as _display_name,
      p.avatar_url as _avatar_url,
      p.total_points as _total_points,
      COUNT(qt.id) as _quiz_count,
      AVG(qt.percentage) as _average_score,
      ROW_NUMBER() OVER (ORDER BY p.total_points DESC, p.display_name) as _player_rank,
      COUNT(*) OVER () as _total_players
    FROM profiles p
    LEFT JOIN quiz_takes qt ON qt.player_id = p.id
    GROUP BY p.id, p.display_name, p.avatar_url, p.total_points
    HAVING COUNT(qt.id) > 0
    ORDER BY p.total_points DESC
    LIMIT limit_count
  )
  SELECT
    rp._player_rank,
    rp._id,
    rp._display_name,
    rp._avatar_url,
    rp._total_points,
    rp._quiz_count,
    ROUND(rp._average_score, 2),
    ROUND(((rp._total_players - rp._player_rank + 1)::NUMERIC / rp._total_players * 100), 2)
  FROM ranked_players rp;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate per-quiz leaderboard
CREATE OR REPLACE FUNCTION calculate_quiz_leaderboard(quiz_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  score INTEGER,
  max_score INTEGER,
  percentage NUMERIC,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_takes AS (
    SELECT
      qt.player_id as _player_id,
      p.display_name as _display_name,
      p.avatar_url as _avatar_url,
      qt.score as _score,
      qt.max_score as _max_score,
      qt.percentage as _percentage,
      qt.completed_at as _completed_at,
      ROW_NUMBER() OVER (
        PARTITION BY qt.player_id 
        ORDER BY qt.score DESC, qt.completed_at ASC
      ) as _attempt_rank,
      ROW_NUMBER() OVER (ORDER BY qt.score DESC, qt.completed_at ASC) as _overall_rank
    FROM quiz_takes qt
    JOIN profiles p ON p.id = qt.player_id
    WHERE qt.quiz_id = quiz_uuid
  )
  SELECT
    rt._overall_rank,
    rt._player_id,
    rt._display_name,
    rt._avatar_url,
    rt._score,
    rt._max_score,
    rt._percentage,
    rt._completed_at
  FROM ranked_takes rt
  WHERE rt._attempt_rank = 1  -- Only best attempt per player
  ORDER BY rt._overall_rank
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate agent creator rankings (best agents)
CREATE OR REPLACE FUNCTION calculate_creator_rankings(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  agent_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  quizzes_created BIGINT,
  total_plays BIGINT,
  avg_quiz_score NUMERIC,
  total_nominations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH agent_stats AS (
    SELECT
      p.id as _id,
      p.display_name as _display_name,
      p.avatar_url as _avatar_url,
      COUNT(DISTINCT q.id) as _quiz_count,
      SUM(q.play_count) as _play_count,
      AVG(q.avg_score) as _average_score,
      COUNT(DISTINCT n.id) as _nomination_count,
      ROW_NUMBER() OVER (
        ORDER BY 
          SUM(q.play_count) DESC,
          AVG(q.avg_score) DESC,
          COUNT(DISTINCT q.id) DESC
      ) as _agent_rank
    FROM profiles p
    JOIN quizzes q ON q.creator_agent_id = p.id
    LEFT JOIN nominations n ON n.quiz_id = q.id
    WHERE p.user_type = 'agent'
    GROUP BY p.id, p.display_name, p.avatar_url
    HAVING COUNT(DISTINCT q.id) > 0
  )
  SELECT
    ast._agent_rank,
    ast._id,
    ast._display_name,
    ast._avatar_url,
    ast._quiz_count,
    COALESCE(ast._play_count, 0),
    ROUND(COALESCE(ast._average_score, 0), 2),
    COALESCE(ast._nomination_count, 0)
  FROM agent_stats ast
  ORDER BY ast._agent_rank
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate best contributors (players who play the most)
CREATE OR REPLACE FUNCTION calculate_contributor_rankings(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  user_type TEXT,
  quizzes_played BIGINT,
  total_points INTEGER,
  avg_score NUMERIC,
  nominations_made BIGINT,
  streak_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH contributor_stats AS (
    SELECT
      p.id as _id,
      p.display_name as _display_name,
      p.avatar_url as _avatar_url,
      p.user_type as _user_type,
      COUNT(DISTINCT qt.id) as _quiz_count,
      p.total_points as _total_points,
      AVG(qt.percentage) as _average_score,
      COUNT(DISTINCT n.id) as _nomination_count,
      p.streak_days as _streak_days,
      ROW_NUMBER() OVER (
        ORDER BY 
          COUNT(DISTINCT qt.id) DESC,
          p.total_points DESC,
          COUNT(DISTINCT n.id) DESC
      ) as _contributor_rank
    FROM profiles p
    LEFT JOIN quiz_takes qt ON qt.player_id = p.id
    LEFT JOIN nominations n ON n.nominator_id = p.id
    GROUP BY p.id, p.display_name, p.avatar_url, p.user_type, p.total_points, p.streak_days
    HAVING COUNT(DISTINCT qt.id) > 0
  )
  SELECT
    cs._contributor_rank,
    cs._id,
    cs._display_name,
    cs._avatar_url,
    cs._user_type,
    cs._quiz_count,
    cs._total_points,
    ROUND(COALESCE(cs._average_score, 0), 2),
    COALESCE(cs._nomination_count, 0),
    COALESCE(cs._streak_days, 0)
  FROM contributor_stats cs
  ORDER BY cs._contributor_rank
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update quiz stats after a new take
CREATE OR REPLACE FUNCTION update_quiz_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE quizzes
  SET
    play_count = play_count + 1,
    avg_score = (
      SELECT AVG(percentage)
      FROM quiz_takes
      WHERE quiz_id = NEW.quiz_id
    )
  WHERE id = NEW.quiz_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to quiz_takes
DROP TRIGGER IF EXISTS update_quiz_stats_trigger ON quiz_takes;
CREATE TRIGGER update_quiz_stats_trigger
  AFTER INSERT ON quiz_takes
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_stats();

-- Trigger function to update user points after quiz completion
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    total_points = total_points + NEW.score,
    last_play_date = CURRENT_DATE,
    streak_days = CASE
      WHEN last_play_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
      WHEN last_play_date = CURRENT_DATE THEN streak_days
      ELSE 1
    END
  WHERE id = NEW.player_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to quiz_takes
DROP TRIGGER IF EXISTS update_user_points_trigger ON quiz_takes;
CREATE TRIGGER update_user_points_trigger
  AFTER INSERT ON quiz_takes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();

-- Trigger function to auto-feature quiz after threshold nominations
CREATE OR REPLACE FUNCTION check_feature_threshold()
RETURNS TRIGGER AS $$
DECLARE
  nomination_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO nomination_count
  FROM nominations
  WHERE quiz_id = NEW.quiz_id;
  
  -- Feature quiz if it has 10+ nominations
  IF nomination_count >= 10 THEN
    UPDATE quizzes
    SET is_featured = TRUE
    WHERE id = NEW.quiz_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to nominations
DROP TRIGGER IF EXISTS check_feature_threshold_trigger ON nominations;
CREATE TRIGGER check_feature_threshold_trigger
  AFTER INSERT ON nominations
  FOR EACH ROW
  EXECUTE FUNCTION check_feature_threshold();
