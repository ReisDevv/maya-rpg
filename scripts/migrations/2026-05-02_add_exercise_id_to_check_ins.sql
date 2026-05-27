-- Production migration for Maya RPG API.
-- Required after adding per-exercise check-ins for the mobile Entrega 2 flow.

ALTER TABLE check_ins
  ADD COLUMN IF NOT EXISTS "exerciseId" uuid;

CREATE INDEX IF NOT EXISTS idx_check_ins_exercise_id
  ON check_ins ("exerciseId");

-- Keep the column nullable during deploy so old local/offline sessions do not
-- break migration. New API writes always validate and populate exerciseId.
