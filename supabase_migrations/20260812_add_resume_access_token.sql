-- Run this once on an existing production database.
-- It adds a private bearer token to every resume record.
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS access_token text UNIQUE;

UPDATE resumes
SET access_token = COALESCE(access_token, gen_random_uuid()::text)
WHERE access_token IS NULL;

ALTER TABLE resumes
  ALTER COLUMN access_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS resumes_access_token_idx
  ON resumes(access_token);
