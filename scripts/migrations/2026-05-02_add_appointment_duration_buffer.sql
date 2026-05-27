ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS "durationMinutes" integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "bufferMinutes" integer NOT NULL DEFAULT 15;
