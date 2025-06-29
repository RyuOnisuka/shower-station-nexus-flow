ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS genkey text,
  ADD COLUMN IF NOT EXISTS createdate date;

ALTER TABLE queues
  ADD CONSTRAINT IF NOT EXISTS queues_genkey_createdate_unique UNIQUE (genkey, createdate); 