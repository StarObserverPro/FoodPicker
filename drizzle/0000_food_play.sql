-- Operation IDs, short-lived results and token usage; never store raw conversations.
CREATE TABLE IF NOT EXISTS food_play_requests (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('chat', 'compose', 'draw')),
  actor TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  period TEXT NOT NULL,
  day TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'complete', 'failed', 'uncertain')),
  reserve_micros INTEGER NOT NULL CHECK (reserve_micros >= 0),
  actual_micros INTEGER CHECK (actual_micros >= 0),
  result_json TEXT,
  usage_json TEXT,
  error_code TEXT
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS food_play_period ON food_play_requests(period);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS food_play_day_kind ON food_play_requests(day, kind);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS food_play_actor_time ON food_play_requests(actor, created_at);
