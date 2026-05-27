CREATE TABLE IF NOT EXISTS email_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL,
  "currentCodeHash" varchar NOT NULL,
  "currentVerified" boolean NOT NULL DEFAULT false,
  "newEmail" varchar NULL,
  "newCodeHash" varchar NULL,
  "expiresAt" timestamp NOT NULL,
  used boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_change_requests_user_active
  ON email_change_requests ("userId", used, "expiresAt");
