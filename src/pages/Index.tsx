import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  xpReward: number;
  condition: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface GameSession {
  id: number;
  date: string;
  score: number;
  duration: number;
  accuracy: number;
  level: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  badge: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, title: "Новобранец", minXP: 0, maxXP: 500, color: "#888888" },
  { level: 2, title: "Боец", minXP: 500, maxXP: 1200, color: "#00aaff" },
  { level: 3, title: "Ветеран", minXP: 1200, maxXP: 2500, color: "#00ffaa" },
  { level: 4, title: "Элита", minXP: 2500, maxXP: 5000, color: "#bf5fff" },
  { level: 5, title: "Легенда", minXP: 5000, maxXP: 10000, color: "#ffd700" },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_blood",
    title: "Первая кровь",
    description: "Завершить первую игровую сессию",
    icon: "Zap",
    color: "#00ffaa",
    xpReward: 50,
    condition: "1 сессия",
    unlocked: true,
    unlockedAt: "12 апр",
  },
  {
    id: "sharp_shooter",
    title: "Снайпер",
    description: "Достичь точности 90%+ в БАС",
    icon: "Target",
    color: "#00aaff",
    xpReward: 150,
    condition: "Точность ≥ 90%",
    unlocked: true,
    unlockedAt: "13 апр",
  },
  {
    id: "speed_demon",
    title: "Демон скорости",
    description: "Набрать 500+ очков за одну сессию",
    icon: "Flame",
    color: "#ff8800",
    xpReward: 200,
    condition: "Очки ≥ 500",
    unlocked: true,
    unlockedAt: "14 апр",
  },
  {
    id: "consistency",
    title: "Железная воля",
    description: "Сыграть 7 дней подряд",
    icon: "Shield",
    color: "#bf5fff",
    xpReward: 300,
    condition: "7-дневная серия",
    unlocked: false,
  },
  {
    id: "highscore",
    title: "Рекордсмен",
    description: "Набрать 1000+ очков за сессию",
    icon: "Trophy",
    color: "#ffd700",
    xpReward: 500,
    condition: "Очки ≥ 1000",
    unlocked: false,
  },
  {
    id: "grind",
    title: "Гриндер",
    description: "Сыграть 50 сессий суммарно",
    icon: "Swords",
    color: "#ff4444",
    xpReward: 400,
    condition: "50 сессий",
    unlocked: false,
  },
  {
    id: "perfect",
    title: "Перфекционист",
    description: "Получить точность 100% в сессии",
    icon: "Star",
    color: "#ffd700",
    xpReward: 750,
    condition: "Точность = 100%",
    unlocked: false,
  },
  {
    id: "marathon",
    title: "Марафонец",
    description: "Провести 30+ минут в игре за день",
    icon: "Timer",
    color: "#00aaff",
    xpReward: 250,
    condition: "30 мин за день",
    unlocked: false,
  },
];

const SESSIONS: GameSession[] = [
  { id: 1, date: "14 апр", score: 647, duration: 18, accuracy: 92, level: "Средний" },
  { id: 2, date: "13 апр", score: 821, duration: 24, accuracy: 87, level: "Сложный" },
  { id: 3, date: "12 апр", score: 504, duration: 15, accuracy: 95, level: "Средний" },
  { id: 4, date: "11 апр", score: 390, duration: 12, accuracy: 78, level: "Лёгкий" },
  { id: 5, date: "10 апр", score: 712, duration: 21, accuracy: 91, level: "Сложный" },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Киберволк_88", xp: 12450, level: 5, badge: "🏆" },
  { rank: 2, name: "NightStar", xp: 9870, level: 5, badge: "⚡" },
  { rank: 3, name: "Ты", xp: 1640, level: 3, badge: "🎯" },
  { rank: 4, name: "DragonSlayer", xp: 1410, level: 3, badge: "🔥" },
  { rank: 5, name: "Phantom_X", xp: 980, level: 2, badge: "💜" },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "ДАШБОРД", icon: "LayoutDashboard" },
  { id: "achievements", label: "ДОСТИЖЕНИЯ", icon: "Trophy" },
  { id: "sessions", label: "СЕССИИ", icon: "History" },
  { id: "leaderboard", label: "РЕЙТИНГ", icon: "Users" },
  { id: "profile", label: "ПРОФИЛЬ", icon: "User" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLevelInfo(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

function getLevelProgress(xp: number) {
  const lvl = getLevelInfo(xp);
  const range = lvl.maxXP - lvl.minXP;
  const progress = xp - lvl.minXP;
  return Math.round((progress / range) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="relative rounded-lg border bg-card p-4 overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, borderColor: `${color}33` }}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}
      />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className="p-1.5 rounded" style={{ background: `${color}22` }}>
          <Icon name={icon} size={14} style={{ color }} />
        </div>
      </div>
      <div className="font-orbitron text-2xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function XPRing({ xp, size = 120 }: { xp: number; size?: number }) {
  const lvl = getLevelInfo(xp);
  const progress = getLevelProgress(xp);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={lvl.color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${lvl.color})`, transition: "stroke-dasharray 1.5s cubic-bezier(0.23,1,0.32,1)" }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="font-orbitron text-xl font-bold" style={{ color: lvl.color }}>
          {lvl.level}
        </div>
        <div className="text-xs text-muted-foreground font-rajdhani">{progress}%</div>
      </div>
    </div>
  );
}

function AchievementCard({ a, index }: { a: Achievement; index: number }) {
  return (
    <div
      className="relative rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
      style={{
        borderColor: a.unlocked ? `${a.color}44` : "rgba(255,255,255,0.06)",
        background: a.unlocked
          ? `linear-gradient(135deg, hsl(var(--card)), ${a.color}0a)`
          : "hsl(var(--card))",
        boxShadow: a.unlocked ? `0 0 20px ${a.color}18` : "none",
        opacity: a.unlocked ? 1 : 0.45,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {a.unlocked && (
        <div
          className="absolute top-2 right-2 text-xs font-orbitron px-2 py-0.5 rounded-full"
          style={{ background: `${a.color}22`, color: a.color }}
        >
          +{a.xpReward} XP
        </div>
      )}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${a.color}20`, border: `1px solid ${a.color}44` }}
      >
        <Icon name={a.icon} size={22} style={{ color: a.unlocked ? a.color : "#555" }} />
      </div>
      <div className="font-orbitron text-sm font-bold mb-1" style={{ color: a.unlocked ? a.color : "#555" }}>
        {a.title}
      </div>
      <div className="text-xs text-muted-foreground font-rajdhani mb-2">{a.description}</div>
      <div className="flex items-center gap-1.5">
        <Icon name={a.unlocked ? "CheckCircle2" : "Lock"} size={12} style={{ color: a.unlocked ? a.color : "#555" }} />
        <span className="text-xs font-rajdhani" style={{ color: a.unlocked ? a.color : "#555" }}>
          {a.unlocked ? `Разблокировано ${a.unlockedAt}` : a.condition}
        </span>
      </div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function Dashboard({ playerXP }: { playerXP: number }) {
  const lvl = getLevelInfo(playerXP);
  const progress = getLevelProgress(playerXP);
  const nextLvl = LEVELS.find((l) => l.level === lvl.level + 1);
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Hero player card */}
      <div
        className="relative rounded-2xl border overflow-hidden p-6 animate-fade-in-up"
        style={{
          borderColor: `${lvl.color}44`,
          background: `linear-gradient(135deg, hsl(var(--card)) 60%, ${lvl.color}08)`,
          boxShadow: `0 0 40px ${lvl.color}18`,
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${lvl.color}22 0, ${lvl.color}22 1px, transparent 0, transparent 50%)`,
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <XPRing xp={playerXP} size={110} />
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-rajdhani tracking-[0.3em] uppercase mb-1" style={{ color: lvl.color }}>
              Уровень {lvl.level} · {lvl.title}
            </div>
            <div className="font-orbitron text-3xl font-black text-white mb-1">ИГРОК_001</div>
            <div className="text-muted-foreground font-rajdhani text-sm mb-4">
              {playerXP.toLocaleString()} XP / {nextLvl ? nextLvl.minXP.toLocaleString() : "∞"} XP
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full xp-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground font-rajdhani">{progress}% до следующего уровня</span>
              {nextLvl && (
                <span className="text-xs font-rajdhani" style={{ color: lvl.color }}>
                  {(nextLvl.minXP - playerXP).toLocaleString()} XP
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Всего XP" value={playerXP.toLocaleString()} icon="Zap" color="#00ffaa" delay={0} />
        <StatCard label="Сессий" value={SESSIONS.length} icon="Gamepad2" color="#00aaff" delay={60} />
        <StatCard label="Достижений" value={`${unlockedCount}/${ACHIEVEMENTS.length}`} icon="Trophy" color="#ffd700" delay={120} />
        <StatCard label="Лучший счёт" value="821" icon="Flame" color="#ff8800" delay={180} />
      </div>

      {/* Recent sessions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="History" size={16} style={{ color: "#00ffaa" }} />
          <span className="font-orbitron text-sm text-white">ПОСЛЕДНИЕ СЕССИИ</span>
        </div>
        <div className="space-y-2">
          {SESSIONS.slice(0, 3).map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-lg border border-white/5 bg-card px-4 py-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon name="Gamepad2" size={16} style={{ color: "#00ffaa" }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-rajdhani font-semibold text-white">{s.date} · {s.level}</div>
                <div className="text-xs text-muted-foreground">{s.duration} мин · точность {s.accuracy}%</div>
              </div>
              <div className="font-orbitron text-lg font-bold" style={{ color: "#ffd700" }}>{s.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Unlocked badges */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Medal" size={16} style={{ color: "#ffd700" }} />
          <span className="font-orbitron text-sm text-white">РАЗБЛОКОВАННЫЕ БЕЙДЖИ</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {ACHIEVEMENTS.filter((a) => a.unlocked).map((a) => (
            <div
              key={a.id}
              className="w-14 h-14 rounded-xl flex items-center justify-center animate-float"
              style={{
                background: `${a.color}18`,
                border: `1px solid ${a.color}44`,
                boxShadow: `0 0 14px ${a.color}30`,
              }}
              title={a.title}
            >
              <Icon name={a.icon} size={24} style={{ color: a.color }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Achievements() {
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked);
  const locked = ACHIEVEMENTS.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-xl font-bold text-white">ДОСТИЖЕНИЯ</h2>
          <p className="text-sm text-muted-foreground font-rajdhani mt-1">
            {unlocked.length} из {ACHIEVEMENTS.length} разблокировано
          </p>
        </div>
        <div className="font-orbitron text-2xl font-black" style={{ color: "#ffd700", textShadow: "0 0 20px #ffd70066" }}>
          {unlocked.length}/{ACHIEVEMENTS.length}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-card p-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-widest">Прогресс коллекции</span>
          <span className="text-xs font-orbitron" style={{ color: "#ffd700" }}>
            {Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%`,
              background: "linear-gradient(90deg, #ffd700, #ff8800)",
              boxShadow: "0 0 10px rgba(255,215,0,0.5)",
              transition: "width 1s ease",
            }}
          />
        </div>
      </div>

      {unlocked.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ backgroundColor: "#00ffaa" }} />
            <span className="font-orbitron text-xs tracking-widest" style={{ color: "#00ffaa" }}>ПОЛУЧЕНО</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {unlocked.map((a, i) => (
              <AchievementCard key={a.id} a={a} index={i} />
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Lock" size={12} className="text-muted-foreground" />
            <span className="font-orbitron text-xs text-muted-foreground tracking-widest">НЕ РАЗБЛОКИРОВАНО</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {locked.map((a, i) => (
              <AchievementCard key={a.id} a={a} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Sessions() {
  const avgScore = Math.round(SESSIONS.reduce((s, g) => s + g.score, 0) / SESSIONS.length);
  const avgAcc = Math.round(SESSIONS.reduce((s, g) => s + g.accuracy, 0) / SESSIONS.length);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-orbitron text-xl font-bold text-white">ИСТОРИЯ СЕССИЙ</h2>
        <p className="text-sm text-muted-foreground font-rajdhani mt-1">Все игровые сессии в БАС</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Средний счёт" value={avgScore} icon="BarChart3" color="#00ffaa" />
        <StatCard label="Средняя точность" value={`${avgAcc}%`} icon="Target" color="#00aaff" />
        <StatCard label="Всего сессий" value={SESSIONS.length} icon="Hash" color="#bf5fff" />
        <StatCard label="Лучший результат" value={Math.max(...SESSIONS.map((s) => s.score))} icon="Trophy" color="#ffd700" />
      </div>

      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 grid grid-cols-5 text-xs font-orbitron text-muted-foreground">
          <span>ДАТА</span>
          <span className="text-center">СЧЁТ</span>
          <span className="text-center">ВРЕМЯ</span>
          <span className="text-center">ТОЧНОСТЬ</span>
          <span className="text-center">РЕЖИМ</span>
        </div>
        {SESSIONS.map((s, i) => (
          <div
            key={s.id}
            className="px-4 py-3 border-b border-white/5 last:border-0 grid grid-cols-5 items-center animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-sm font-rajdhani text-white">{s.date}</span>
            <div className="text-center">
              <span
                className="font-orbitron text-lg font-bold"
                style={{
                  color: s.score >= 700 ? "#00ffaa" : s.score >= 500 ? "#ffd700" : "#ff8800",
                  textShadow: s.score >= 700 ? "0 0 10px #00ffaa66" : "none",
                }}
              >
                {s.score}
              </span>
            </div>
            <div className="text-center text-sm font-rajdhani text-muted-foreground">{s.duration} мин</div>
            <div className="text-center">
              <span
                className="text-sm font-rajdhani font-semibold"
                style={{ color: s.accuracy >= 90 ? "#00ffaa" : s.accuracy >= 80 ? "#ffd700" : "#ff4444" }}
              >
                {s.accuracy}%
              </span>
            </div>
            <div className="text-center">
              <span
                className="text-xs font-rajdhani px-2 py-0.5 rounded-full"
                style={{
                  background: s.level === "Сложный" ? "#bf5fff22" : s.level === "Средний" ? "#00aaff22" : "#00ffaa22",
                  color: s.level === "Сложный" ? "#bf5fff" : s.level === "Средний" ? "#00aaff" : "#00ffaa",
                }}
              >
                {s.level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Leaderboard() {
  const meRank = LEADERBOARD.find((e) => e.name === "Ты");
  const rankColors = ["#ffd700", "#c0c0c0", "#00ffaa", "#888888", "#888888"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-orbitron text-xl font-bold text-white">ТАБЛИЦА ЛИДЕРОВ</h2>
        <p className="text-sm text-muted-foreground font-rajdhani mt-1">Топ игроков по XP</p>
      </div>

      {meRank && (
        <div
          className="rounded-lg border px-4 py-3 flex items-center gap-3"
          style={{
            borderColor: "#00ffaa44",
            background: "linear-gradient(135deg, hsl(var(--card)), #00ffaa08)",
            boxShadow: "0 0 20px #00ffaa18",
          }}
        >
          <Icon name="User" size={16} style={{ color: "#00ffaa" }} />
          <span className="font-rajdhani text-sm text-white">Твоя позиция:</span>
          <span className="font-orbitron font-bold" style={{ color: "#00ffaa" }}>#{meRank.rank}</span>
          <span className="text-muted-foreground font-rajdhani text-sm ml-auto">
            {meRank.xp.toLocaleString()} XP
          </span>
        </div>
      )}

      <div className="space-y-2">
        {LEADERBOARD.map((entry, i) => {
          const isMe = entry.name === "Ты";
          const rankColor = rankColors[i] || "#888";

          return (
            <div
              key={entry.rank}
              className="flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-200 hover:scale-[1.01] animate-fade-in-up"
              style={{
                borderColor: isMe ? "#00ffaa44" : "rgba(255,255,255,0.06)",
                background: isMe ? "linear-gradient(135deg, hsl(var(--card)), #00ffaa08)" : "hsl(var(--card))",
                boxShadow: i < 3 ? `0 0 14px ${rankColor}18` : "none",
                animationDelay: `${i * 80}ms`,
              }}
            >
              <div className="w-8 text-center font-orbitron text-sm font-bold" style={{ color: rankColor }}>
                #{entry.rank}
              </div>
              <div className="text-xl">{entry.badge}</div>
              <div className="flex-1">
                <div className="font-rajdhani font-semibold text-sm" style={{ color: isMe ? "#00ffaa" : "white" }}>
                  {entry.name}
                  {isMe && <span className="ml-2 text-xs font-orbitron opacity-70" style={{ color: "#00ffaa" }}>(ты)</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  Уровень {entry.level} · {LEVELS.find((l) => l.level === entry.level)?.title}
                </div>
              </div>
              <div className="text-right">
                <div className="font-orbitron text-sm font-bold" style={{ color: rankColor }}>
                  {entry.xp.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Profile({ playerXP }: { playerXP: number }) {
  const lvl = getLevelInfo(playerXP);
  const unlockedAch = ACHIEVEMENTS.filter((a) => a.unlocked);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-orbitron text-xl font-bold text-white">ПРОФИЛЬ ИГРОКА</h2>
        <p className="text-sm text-muted-foreground font-rajdhani mt-1">Твоя игровая карточка</p>
      </div>

      <div
        className="relative rounded-2xl border overflow-hidden p-6"
        style={{
          borderColor: `${lvl.color}44`,
          background: `linear-gradient(135deg, hsl(var(--card)) 50%, ${lvl.color}08)`,
          boxShadow: `0 0 40px ${lvl.color}18`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ background: `${lvl.color}20`, border: `2px solid ${lvl.color}66` }}
            >
              <Icon name="User" size={44} style={{ color: lvl.color }} />
            </div>
            <div
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center font-orbitron text-xs font-bold"
              style={{ background: lvl.color, color: "#0a0d14" }}
            >
              {lvl.level}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-orbitron text-2xl font-black text-white mb-1">ИГРОК_001</div>
            <div className="font-rajdhani text-sm mb-3" style={{ color: lvl.color }}>
              {lvl.title} · БАС Арена
            </div>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-sm font-rajdhani text-muted-foreground">
              <span>📅 Регистрация: 10 апр 2026</span>
              <span>🎮 Сессий: {SESSIONS.length}</span>
              <span>🏆 Достижений: {unlockedAch.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Всего XP" value={playerXP.toLocaleString()} icon="Zap" color="#00ffaa" />
        <StatCard label="Уровень" value={lvl.level} icon="ChevronUp" color={lvl.color} />
        <StatCard label="Ранг" value="#3" icon="Award" color="#ffd700" />
        <StatCard label="Лучший счёт" value="821" icon="Trophy" color="#ff8800" />
        <StatCard label="Серия дней" value="4" icon="Flame" color="#ff4444" />
        <StatCard label="Ср. точность" value="89%" icon="Target" color="#00aaff" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Medal" size={16} style={{ color: "#ffd700" }} />
          <span className="font-orbitron text-sm text-white">МОИ ДОСТИЖЕНИЯ</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {unlockedAch.map((a, i) => (
            <div
              key={a.id}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 animate-fade-in-up"
              style={{
                background: `${a.color}15`,
                border: `1px solid ${a.color}44`,
                boxShadow: `0 0 12px ${a.color}20`,
                animationDelay: `${i * 80}ms`,
              }}
              title={a.title}
            >
              <Icon name={a.icon} size={20} style={{ color: a.color }} />
              <span className="text-[9px] font-orbitron text-center leading-tight" style={{ color: a.color }}>
                {a.title.split(" ")[0]}
              </span>
            </div>
          ))}
          {Array.from({ length: ACHIEVEMENTS.length - unlockedAch.length }).map((_, i) => (
            <div
              key={`lock-${i}`}
              className="aspect-square rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Icon name="Lock" size={16} className="text-muted-foreground" style={{ opacity: 0.4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Index() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [playerXP] = useState(1640);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const lvl = getLevelInfo(playerXP);

  return (
    <div className="min-h-screen bg-background grid-bg scanlines">
      {/* Top bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md"
        style={{ background: "rgba(10,13,22,0.92)" }}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
              style={{ background: "#00ffaa20", border: "1px solid #00ffaa44" }}
            >
              <Icon name="Gamepad2" size={16} style={{ color: "#00ffaa" }} />
            </div>
            <span className="font-orbitron text-sm font-bold text-white animate-flicker" style={{ letterSpacing: "0.1em" }}>
              БАС<span style={{ color: "#00ffaa" }}>_</span>АРЕНА
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-orbitron transition-all duration-200"
                style={{
                  color: activeTab === item.id ? lvl.color : "#666",
                  background: activeTab === item.id ? `${lvl.color}15` : "transparent",
                  borderBottom: activeTab === item.id ? `1px solid ${lvl.color}` : "1px solid transparent",
                }}
              >
                <Icon name={item.icon} size={13} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* XP pill */}
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: `${lvl.color}15`, border: `1px solid ${lvl.color}33` }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: lvl.color }} />
            <span className="font-orbitron text-xs" style={{ color: lvl.color }}>
              LVL {lvl.level} · {playerXP.toLocaleString()} XP
            </span>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ background: "#00ffaa15", color: "#00ffaa" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={18} />
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t border-white/5 px-4 py-3 grid grid-cols-5 gap-1"
            style={{ background: "rgba(10,13,22,0.98)" }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-orbitron transition-all"
                style={{
                  color: activeTab === item.id ? lvl.color : "#666",
                  background: activeTab === item.id ? `${lvl.color}15` : "transparent",
                }}
              >
                <Icon name={item.icon} size={16} />
                <span className="text-[9px]">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 pt-20 pb-10">
        <div key={activeTab} className="animate-fade-in">
          {activeTab === "dashboard" && <Dashboard playerXP={playerXP} />}
          {activeTab === "achievements" && <Achievements />}
          {activeTab === "sessions" && <Sessions />}
          {activeTab === "leaderboard" && <Leaderboard />}
          {activeTab === "profile" && <Profile playerXP={playerXP} />}
        </div>
      </main>
    </div>
  );
}