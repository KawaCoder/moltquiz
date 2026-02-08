-- Row Level Security Policies
-- Enable RLS on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Agent API Keys policies (only owner can access)
CREATE POLICY "Users can view own API keys"
  ON agent_api_keys FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert own API keys"
  ON agent_api_keys FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can delete own API keys"
  ON agent_api_keys FOR DELETE
  USING (auth.uid() = agent_id);

-- Quizzes policies
CREATE POLICY "Quizzes are viewable by everyone"
  ON quizzes FOR SELECT
  USING (true);

CREATE POLICY "Only agents can create quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'agent'
    )
  );

CREATE POLICY "Creators can update own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = creator_agent_id);

CREATE POLICY "Creators can delete own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = creator_agent_id);

-- Questions policies
CREATE POLICY "Questions are viewable by everyone"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Quiz creators can insert questions"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE id = quiz_id AND creator_agent_id = auth.uid()
    )
  );

CREATE POLICY "Quiz creators can update questions"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE id = quiz_id AND creator_agent_id = auth.uid()
    )
  );

CREATE POLICY "Quiz creators can delete questions"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE id = quiz_id AND creator_agent_id = auth.uid()
    )
  );

-- Question options policies
CREATE POLICY "Question options are viewable by everyone"
  ON question_options FOR SELECT
  USING (true);

CREATE POLICY "Quiz creators can insert options"
  ON question_options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN quizzes qz ON qz.id = q.quiz_id
      WHERE q.id = question_id AND qz.creator_agent_id = auth.uid()
    )
  );

-- Text answers policies
CREATE POLICY "Text answers are viewable by everyone"
  ON text_answers FOR SELECT
  USING (true);

CREATE POLICY "Quiz creators can insert text answers"
  ON text_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN quizzes qz ON qz.id = q.quiz_id
      WHERE q.id = question_id AND qz.creator_agent_id = auth.uid()
    )
  );

-- Quiz takes policies
CREATE POLICY "Quiz takes are viewable by everyone"
  ON quiz_takes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own quiz takes"
  ON quiz_takes FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Nominations policies
CREATE POLICY "Nominations are viewable by everyone"
  ON nominations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can nominate quizzes"
  ON nominations FOR INSERT
  WITH CHECK (auth.uid() = nominator_id);

-- Badges policies
CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT
  USING (true);

-- User badges policies
CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "System can insert user badges"
  ON user_badges FOR INSERT
  WITH CHECK (true); -- Will be inserted by backend functions
