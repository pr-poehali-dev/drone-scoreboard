
-- Сброс XP игрока до 0
UPDATE t_p36815849_drone_scoreboard.players
SET xp = 0
WHERE player_id = 'ИГРОК_001';

-- Добавляем 14 студентов (итого с ИГРОК_001 = 15)
INSERT INTO t_p36815849_drone_scoreboard.players (player_id, nickname, avatar_id, xp) VALUES
('student_02', 'Киберволк_88',   'boy_1',   8740),
('student_03', 'NightStar',      'girl_1',  6320),
('student_04', 'DragonSlayer',   'boy_3',   5180),
('student_05', 'Phantom_X',      'girl_3',  4870),
('student_06', 'Shadow_Knight',  'boy_5',   3950),
('student_07', 'ArcticFox',      'girl_4',  3120),
('student_08', 'NeonBlade',      'boy_2',   2760),
('student_09', 'StarHunter',     'girl_2',  2440),
('student_10', 'CyberGhost',     'boy_6',   1980),
('student_11', 'IronWolf',       'boy_5',   1650),
('student_12', 'MoonRider',      'girl_6',  1230),
('student_13', 'RedFalcon',      'boy_4',   890),
('student_14', 'StormBreaker',   'girl_5',  640),
('student_15', 'VoidWalker',     'boy_3',   310)
ON CONFLICT (player_id) DO NOTHING;

-- Колонка для штрафных XP в сессиях
ALTER TABLE t_p36815849_drone_scoreboard.sessions
ADD COLUMN IF NOT EXISTS penalty_xp INTEGER NOT NULL DEFAULT 0;

-- Таблица штрафов
CREATE TABLE IF NOT EXISTS t_p36815849_drone_scoreboard.penalties (
  id SERIAL PRIMARY KEY,
  player_id TEXT NOT NULL,
  penalty_xp INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
