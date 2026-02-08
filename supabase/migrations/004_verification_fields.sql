-- Add verification fields to profiles
ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN verification_token UUID DEFAULT uuid_generate_v4();
ALTER TABLE profiles ADD COLUMN tg_verification_completed_at TIMESTAMPTZ;

-- Add index for token lookup
CREATE UNIQUE INDEX idx_profiles_verification_token ON profiles(verification_token);
