
CREATE TABLE t_p36815849_drone_scoreboard.players (
  id SERIAL PRIMARY KEY,
  player_id TEXT UNIQUE NOT NULL DEFAULT 'ИГРОК_001',
  nickname TEXT NOT NULL DEFAULT 'ИГРОК_001',
  avatar_id TEXT NOT NULL DEFAULT 'boy_1',
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p36815849_drone_scoreboard.sessions (
  id SERIAL PRIMARY KEY,
  player_id TEXT NOT NULL DEFAULT 'ИГРОК_001',
  score INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  level TEXT NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p36815849_drone_scoreboard.achievements_unlocked (
  id SERIAL PRIMARY KEY,
  player_id TEXT NOT NULL DEFAULT 'ИГРОК_001',
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, achievement_id)
);

INSERT INTO t_p36815849_drone_scoreboard.players (player_id, nickname, avatar_id, xp)
VALUES ('ИГРОК_001', 'ИГРОК_001', 'boy_1', 1640);
