import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/bb5c48e3-b0c4-470f-be46-41fd993e489b";
const PLAYER_ID = "ИГРОК_001";

// ─── Avatars ──────────────────────────────────────────────────────────────────
const AVATARS = {
  boys: [
    { id: "boy_1", emoji: "🧑‍🚀", label: "Астронавт" },
    { id: "boy_2", emoji: "🧑‍💻", label: "Кодер" },
    { id: "boy_3", emoji: "⚔️", label: "Воин" },
    { id: "boy_4", emoji: "🦊", label: "Лис" },
    { id: "boy_5", emoji: "🐺", label: "Волк" },
    { id: "boy_6", emoji: "🤖", label: "Робот" },
  ],
  girls: [
    { id: "girl_1", emoji: "👩‍🚀", label: "Астронавтка" },
    { id: "girl_2", emoji: "👩‍💻", label: "Хакерша" },
    { id: "girl_3", emoji: "🧝‍♀️", label: "Эльфийка" },
    { id: "girl_4", emoji: "🦋", label: "Бабочка" },
    { id: "girl_5", emoji: "🐱", label: "Кошка" },
    { id: "girl_6", emoji: "🌙", label: "Луна" },
  ],
};

function getAvatarEmoji(avatarId: string): string {
  const all = [...AVATARS.boys, ...AVATARS.girls];
  return all.find((a) => a.id === avatarId)?.emoji ?? "🎮";
}

// ─── Levels ───────────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, title: "Новобранец", minXP: 0, maxXP: 500, color: "#888888" },
  { level: 2, title: "Боец", minXP: 500, maxXP: 1200, color: "#00aaff" },
  { level: 3, title: "Ветеран", minXP: 1200, maxXP: 2500, color: "#00ffaa" },
  { level: 4, title: "Элита", minXP: 2500, maxXP: 5000, color: "#bf5fff" },
  { level: 5, title: "Легенда", minXP: 5000, maxXP: 10000, color: "#ffd700" },
];

const ACHIEVEMENTS_META: Record<string, { title: string; description: string; icon: string; color: string; xpReward: number; condition: string }> = {
  first_blood:   { title: "Первая кровь",    description: "Завершить первую игровую сессию",         icon: "Zap",        color: "#00ffaa", xpReward: 50,  condition: "1 сессия" },
  sharp_shooter: { title: "Снайпер",         description: "Достичь точности 90%+ в БАС",             icon: "Target",     color: "#00aaff", xpReward: 150, condition: "Точность ≥ 90%" },
  speed_demon:   { title: "Демон скорости",  description: "Набрать 500+ очков за одну сессию",       icon: "Flame",      color: "#ff8800", xpReward: 200, condition: "Очки ≥ 500" },
  consistency:   { title: "Железная воля",   description: "Сыграть 7 дней подряд",                   icon: "Shield",     color: "#bf5fff", xpReward: 300, condition: "7-дневная серия" },
  highscore:     { title: "Рекордсмен",      description: "Набрать 1000+ очков за сессию",           icon: "Trophy",     color: "#ffd700", xpReward: 500, condition: "Очки ≥ 1000" },
  grind:         { title: "Гриндер",         description: "Сыграть 50 сессий суммарно",               icon: "Swords",     color: "#ff4444", xpReward: 400, condition: "50 сессий" },
  perfect:       { title: "Перфекционист",   description: "Получить точность 100% в сессии",         icon: "Star",       color: "#ffd700", xpReward: 750, condition: "Точность = 100%" },
  marathon:      { title: "Марафонец",       description: "Провести 30+ минут в игре за день",       icon: "Timer",      color: "#00aaff", xpReward: 250, condition: "30 мин за день" },
  dark_king:     { title: "Король тьмы",     description: "Сыграть 10+ сессий без единого штрафа",   icon: "Crown",      color: "#6600cc", xpReward: 600, condition: "10 сессий без штрафов" },
  night_hunter:  { title: "Ночной охотник",  description: "Точность ≥ 85% и счёт ≥ 700 в одной сессии", icon: "Moon",  color: "#0066ff", xpReward: 450, condition: "Точность ≥ 85% и счёт ≥ 700" },
};

const ALL_ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS_META);

function getLevelInfo(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}
function getLevelProgress(xp: number) {
  const lvl = getLevelInfo(xp);
  return Math.round(((xp - lvl.minXP) / (lvl.maxXP - lvl.minXP)) * 100);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
  id: number;
  date: string;
  score: number;
  duration: number;
  accuracy: number;
  level: string;
  xp_earned: number;
  penalty_xp: number;
}
interface PlayerProfile {
  nickname: string;
  avatar_id: string;
  xp: number;
  achievements: { id: string; unlocked_at: string }[];
}
interface LeaderEntry {
  player_id: string;
  nickname: string;
  avatar_id: string;
  xp: number;
  rank: number;
  is_me: boolean;
}

const NAV_ITEMS = [
  { id: "dashboard",    label: "ДАШБОРД",    icon: "LayoutDashboard" },
  { id: "new-session",  label: "СЕССИЯ",     icon: "Plus" },
  { id: "achievements", label: "ДОСТИЖЕНИЯ", icon: "Trophy" },
  { id: "sessions",     label: "ИСТОРИЯ",    icon: "History" },
  { id: "leaderboard",  label: "РЕЙТИНГ",    icon: "Users" },
  { id: "profile",      label: "ПРОФИЛЬ",    icon: "User" },
];

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, delay = 0 }: { label: string; value: string | number; icon: string; color: string; delay?: number }) {
  return (
    <div className="relative rounded-lg border bg-card p-4 overflow-hidden animate-fade-in-up" style={{ animationDelay: `${delay}ms`, borderColor: `${color}33` }}>
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className="p-1.5 rounded" style={{ background: `${color}22` }}>
          <Icon name={icon} size={14} style={{ color }} />
        </div>
      </div>
      <div className="font-orbitron text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── XPRing ───────────────────────────────────────────────────────────────────
function XPRing({ xp, size = 110 }: { xp: number; size?: number }) {
  const lvl = getLevelInfo(xp);
  const progress = getLevelProgress(xp);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={lvl.color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${lvl.color})`, transition: "stroke-dasharray 1.5s cubic-bezier(0.23,1,0.32,1)" }} />
      </svg>
      <div className="text-center z-10">
        <div className="font-orbitron text-xl font-bold" style={{ color: lvl.color }}>{lvl.level}</div>
        <div className="text-xs text-muted-foreground font-rajdhani">{progress}%</div>
      </div>
    </div>
  );
}

// ─── AchievementCard ──────────────────────────────────────────────────────────
function AchievementCard({ achId, unlockedAt, index }: { achId: string; unlockedAt?: string; index: number }) {
  const m = ACHIEVEMENTS_META[achId];
  if (!m) return null;
  const unlocked = !!unlockedAt;
  return (
    <div
      className="relative rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
      style={{
        borderColor: unlocked ? `${m.color}44` : "rgba(255,255,255,0.06)",
        background: unlocked ? `linear-gradient(135deg, hsl(var(--card)), ${m.color}0a)` : "hsl(var(--card))",
        boxShadow: unlocked ? `0 0 20px ${m.color}18` : "none",
        opacity: unlocked ? 1 : 0.45,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {unlocked && (
        <div className="absolute top-2 right-2 text-xs font-orbitron px-2 py-0.5 rounded-full" style={{ background: `${m.color}22`, color: m.color }}>
          +{m.xpReward} XP
        </div>
      )}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${m.color}20`, border: `1px solid ${m.color}44` }}>
        <Icon name={m.icon} size={22} style={{ color: unlocked ? m.color : "#555" }} />
      </div>
      <div className="font-orbitron text-sm font-bold mb-1" style={{ color: unlocked ? m.color : "#555" }}>{m.title}</div>
      <div className="text-xs text-muted-foreground font-rajdhani mb-2">{m.description}</div>
      <div className="flex items-center gap-1.5">
        <Icon name={unlocked ? "CheckCircle2" : "Lock"} size={12} style={{ color: unlocked ? m.color : "#555" }} />
        <span className="text-xs font-rajdhani" style={{ color: unlocked ? m.color : "#555" }}>
          {unlocked ? `Разблокировано ${unlockedAt}` : m.condition}
        </span>
      </div>
    </div>
  );
}

// ─── XP Popup ─────────────────────────────────────────────────────────────────
function XPPopup({ xp, achievements, penalty, onClose }: { xp: number; achievements: string[]; penalty: number; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed top-20 right-4 z-[100] rounded-2xl border p-5 animate-scale-in max-w-xs"
      style={{ background: "hsl(var(--card))", borderColor: "#00ffaa44", boxShadow: "0 0 30px #00ffaa33" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#00ffaa20" }}>
          <Icon name="Zap" size={20} style={{ color: "#00ffaa" }} />
        </div>
        <div>
          <div className="font-orbitron text-sm font-bold" style={{ color: "#00ffaa" }}>+{xp} XP</div>
          <div className="text-xs text-muted-foreground font-rajdhani">Сессия сохранена!</div>
        </div>
      </div>
      {penalty > 0 && (
        <div className="flex items-center gap-2 mb-2 text-xs font-rajdhani" style={{ color: "#ff4444" }}>
          <Icon name="AlertTriangle" size={12} />
          <span>Штраф: −{penalty} XP</span>
        </div>
      )}
      {achievements.length > 0 && (
        <div className="space-y-1">
          {achievements.map((id) => {
            const m = ACHIEVEMENTS_META[id];
            return m ? (
              <div key={id} className="flex items-center gap-2 text-xs font-rajdhani" style={{ color: m.color }}>
                <Icon name="Trophy" size={12} />
                <span>Разблокировано: {m.title}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Avatar Picker ─────────────────────────────────────────────────────────────
function AvatarPicker({ current, onSelect }: { current: string; onSelect: (id: string) => void }) {
  const [tab, setTab] = useState<"boys" | "girls">("boys");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["boys", "girls"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg font-orbitron text-xs transition-all"
            style={{
              background: tab === t ? "#00ffaa20" : "transparent",
              color: tab === t ? "#00ffaa" : "#666",
              border: `1px solid ${tab === t ? "#00ffaa44" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {t === "boys" ? "👦 МАЛЬЧИКИ" : "👧 ДЕВОЧКИ"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {AVATARS[tab].map((av) => {
          const selected = current === av.id;
          return (
            <button
              key={av.id}
              onClick={() => onSelect(av.id)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105"
              style={{
                background: selected ? "#00ffaa20" : "rgba(255,255,255,0.03)",
                border: `2px solid ${selected ? "#00ffaa" : "rgba(255,255,255,0.08)"}`,
                boxShadow: selected ? "0 0 20px #00ffaa33" : "none",
              }}
            >
              <span className="text-3xl">{av.emoji}</span>
              <span className="text-[10px] font-rajdhani" style={{ color: selected ? "#00ffaa" : "#888" }}>
                {av.label}
              </span>
              {selected && <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ backgroundColor: "#00ffaa" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────
function Dashboard({ profile, sessions, onTabChange }: {
  profile: PlayerProfile | null;
  sessions: Session[];
  onTabChange: (t: string) => void;
}) {
  const xp = profile?.xp ?? 0;
  const lvl = getLevelInfo(xp);
  const progress = getLevelProgress(xp);
  const nextLvl = LEVELS.find((l) => l.level === lvl.level + 1);
  const unlockedCount = profile?.achievements.length ?? 0;
  const bestScore = sessions.length ? Math.max(...sessions.map((s) => s.score)) : 0;

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="relative rounded-2xl border overflow-hidden p-6 animate-fade-in-up"
        style={{ borderColor: `${lvl.color}44`, background: `linear-gradient(135deg, hsl(var(--card)) 60%, ${lvl.color}08)`, boxShadow: `0 0 40px ${lvl.color}18` }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${lvl.color}22 0, ${lvl.color}22 1px, transparent 0, transparent 50%)`,
          backgroundSize: "20px 20px",
        }} />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <XPRing xp={xp} size={110} />
            <div className="absolute -bottom-1 -right-1 text-2xl">{getAvatarEmoji(profile?.avatar_id ?? "boy_1")}</div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-rajdhani tracking-[0.3em] uppercase mb-1" style={{ color: lvl.color }}>
              Уровень {lvl.level} · {lvl.title}
            </div>
            <div className="font-orbitron text-3xl font-black text-white mb-1">{profile?.nickname ?? "..."}</div>
            <div className="text-muted-foreground font-rajdhani text-sm mb-4">
              {xp.toLocaleString()} XP / {nextLvl ? nextLvl.minXP.toLocaleString() : "∞"} XP
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full xp-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground font-rajdhani">{progress}% до следующего уровня</span>
              {nextLvl && <span className="text-xs font-rajdhani" style={{ color: lvl.color }}>{(nextLvl.minXP - xp).toLocaleString()} XP</span>}
            </div>
          </div>
        </div>
      </div>

      {/* CTA: добавить сессию */}
      <button
        onClick={() => onTabChange("new-session")}
        className="w-full rounded-xl py-4 font-orbitron text-sm font-bold transition-all duration-200 hover:scale-[1.01] flex items-center justify-center gap-3"
        style={{ background: "linear-gradient(135deg, #00ffaa20, #00aaff10)", border: "1px solid #00ffaa44", color: "#00ffaa", boxShadow: "0 0 20px #00ffaa15" }}
      >
        <Icon name="Plus" size={18} />
        ЗАПИСАТЬ НОВУЮ СЕССИЮ БАС
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Всего XP" value={xp.toLocaleString()} icon="Zap" color="#00ffaa" delay={0} />
        <StatCard label="Сессий" value={sessions.length} icon="Gamepad2" color="#00aaff" delay={60} />
        <StatCard label="Достижений" value={`${unlockedCount}/${ALL_ACHIEVEMENT_IDS.length}`} icon="Trophy" color="#ffd700" delay={120} />
        <StatCard label="Лучший счёт" value={bestScore} icon="Flame" color="#ff8800" delay={180} />
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="History" size={16} style={{ color: "#00ffaa" }} />
            <span className="font-orbitron text-sm text-white">ПОСЛЕДНИЕ СЕССИИ</span>
          </div>
          <div className="space-y-2">
            {sessions.slice(0, 3).map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 rounded-lg border border-white/5 bg-card px-4 py-3 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon name="Gamepad2" size={16} style={{ color: "#00ffaa" }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-rajdhani font-semibold text-white">{s.date} · {s.level}</div>
                  <div className="text-xs text-muted-foreground">{s.duration} мин · точность {s.accuracy}%</div>
                </div>
                <div className="text-right">
                  <div className="font-orbitron text-lg font-bold" style={{ color: "#ffd700" }}>{s.score}</div>
                  <div className="text-xs font-rajdhani" style={{ color: "#00ffaa" }}>+{s.xp_earned} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unlocked badges */}
      {(profile?.achievements.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Medal" size={16} style={{ color: "#ffd700" }} />
            <span className="font-orbitron text-sm text-white">РАЗБЛОКОВАННЫЕ БЕЙДЖИ</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {profile!.achievements.map((a) => {
              const m = ACHIEVEMENTS_META[a.id];
              if (!m) return null;
              return (
                <div key={a.id} className="w-14 h-14 rounded-xl flex items-center justify-center animate-float"
                  style={{ background: `${m.color}18`, border: `1px solid ${m.color}44`, boxShadow: `0 0 14px ${m.color}30` }}
                  title={m.title}>
                  <Icon name={m.icon} size={24} style={{ color: m.color }} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NewSession({ onSuccess }: { onSuccess: (xp: number, achs: string[], penaltyXp: number) => void }) {
  const [score, setScore] = useState("");
  const [duration, setDuration] = useState("");
  const [accuracy, setAccuracy] = useState("");
  const [level, setLevel] = useState("Средний");
  const [penaltyXp, setPenaltyXp] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.5rem",
    color: "white",
    padding: "0.75rem 1rem",
    fontFamily: "Rajdhani, sans-serif",
    fontSize: "1rem",
    width: "100%",
    outline: "none",
  };

  const handleSubmit = async () => {
    if (!score || !duration || !accuracy) { setError("Заполни все поля"); return; }
    const sc = parseInt(score), dur = parseInt(duration), acc = parseInt(accuracy);
    if (isNaN(sc) || isNaN(dur) || isNaN(acc)) { setError("Введи числа"); return; }
    if (acc < 0 || acc > 100) { setError("Точность: 0–100"); return; }
    const pen = penaltyXp ? Math.max(0, parseInt(penaltyXp)) : 0;

    setLoading(true); setError("");
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_id: PLAYER_ID, score: sc, duration: dur, accuracy: acc, level,
        penalty_xp: pen, penalty_reason: penaltyReason || "Штраф за нарушение",
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setScore(""); setDuration(""); setAccuracy(""); setLevel("Средний");
      setPenaltyXp(""); setPenaltyReason("");
      onSuccess(data.net_xp + (data.bonus_xp || 0), data.new_achievements || [], data.penalty_xp || 0);
    } else {
      setError("Ошибка сохранения");
    }
  };

  const previewXp = score && duration && accuracy
    ? Math.max(0, Math.round(parseInt(score || "0") / 5 + parseInt(duration || "0") * 2) - (parseInt(penaltyXp || "0") || 0))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-orbitron text-xl font-bold text-white">НОВАЯ СЕССИЯ БАС</h2>
        <p className="text-sm text-muted-foreground font-rajdhani mt-1">Введи результаты и получи XP</p>
      </div>

      <div className="rounded-2xl border p-6 space-y-5"
        style={{ borderColor: "#00ffaa33", background: "linear-gradient(135deg, hsl(var(--card)), #00ffaa05)" }}>
        <div>
          <label className="block text-xs font-orbitron text-muted-foreground uppercase tracking-widest mb-2">Счёт (очки)</label>
          <input type="number" placeholder="например: 750" value={score} onChange={(e) => setScore(e.target.value)} style={inputStyle} min={0} />
        </div>
        <div>
          <label className="block text-xs font-orbitron text-muted-foreground uppercase tracking-widest mb-2">Длительность (мин)</label>
          <input type="number" placeholder="например: 20" value={duration} onChange={(e) => setDuration(e.target.value)} style={inputStyle} min={1} />
        </div>
        <div>
          <label className="block text-xs font-orbitron text-muted-foreground uppercase tracking-widest mb-2">Точность (%)</label>
          <input type="number" placeholder="например: 87" value={accuracy} onChange={(e) => setAccuracy(e.target.value)} style={inputStyle} min={0} max={100} />
        </div>

        <div>
          <label className="block text-xs font-orbitron text-muted-foreground uppercase tracking-widest mb-2">Режим сложности</label>
          <div className="grid grid-cols-3 gap-2">
            {["Лёгкий", "Средний", "Сложный"].map((l) => (
              <button key={l} onClick={() => setLevel(l)} className="py-2.5 rounded-lg font-rajdhani text-sm font-semibold transition-all"
                style={{
                  background: level === l ? (l === "Лёгкий" ? "#00ffaa20" : l === "Средний" ? "#00aaff20" : "#bf5fff20") : "rgba(255,255,255,0.03)",
                  border: `1px solid ${level === l ? (l === "Лёгкий" ? "#00ffaa" : l === "Средний" ? "#00aaff" : "#bf5fff") : "rgba(255,255,255,0.08)"}`,
                  color: level === l ? (l === "Лёгкий" ? "#00ffaa" : l === "Средний" ? "#00aaff" : "#bf5fff") : "#888",
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Штрафные XP */}
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#ff444433", background: "#ff44440a" }}>
          <div className="flex items-center gap-2">
            <Icon name="AlertTriangle" size={14} style={{ color: "#ff4444" }} />
            <span className="text-xs font-orbitron uppercase tracking-widest" style={{ color: "#ff4444" }}>Штрафные XP (необязательно)</span>
          </div>
          <input type="number" placeholder="Количество штрафных XP" value={penaltyXp} onChange={(e) => setPenaltyXp(e.target.value)}
            style={{ ...inputStyle, border: "1px solid #ff444433" }} min={0} />
          <input type="text" placeholder="Причина штрафа" value={penaltyReason} onChange={(e) => setPenaltyReason(e.target.value)}
            style={{ ...inputStyle, border: "1px solid #ff444433" }} />
        </div>

        {/* XP preview */}
        {score && duration && accuracy && (
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "#00ffaa0a", border: "1px solid #00ffaa22" }}>
            <Icon name="Zap" size={16} style={{ color: "#00ffaa" }} />
            <span className="text-sm font-rajdhani text-muted-foreground">Получишь:</span>
            <span className="font-orbitron text-sm font-bold" style={{ color: previewXp > 0 ? "#00ffaa" : "#ff4444" }}>
              ~{previewXp} XP
            </span>
            {penaltyXp && parseInt(penaltyXp) > 0 && (
              <span className="text-xs font-rajdhani ml-auto" style={{ color: "#ff4444" }}>−{penaltyXp} штраф</span>
            )}
          </div>
        )}

        {error && (
          <div className="text-xs font-rajdhani text-red-400 flex items-center gap-2">
            <Icon name="AlertCircle" size={12} />{error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-xl font-orbitron text-sm font-bold transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-3"
          style={{
            background: loading ? "rgba(0,255,170,0.1)" : "linear-gradient(135deg, #00ffaa, #00aaff)",
            color: "#0a0d14",
            boxShadow: loading ? "none" : "0 0 30px rgba(0,255,170,0.4)",
          }}>
          {loading ? <><Icon name="Loader" size={16} className="animate-spin" />СОХРАНЕНИЕ...</>
                   : <><Icon name="Save" size={16} />СОХРАНИТЬ СЕССИЮ</>}
        </button>
      </div>
    </div>
  );
}

function Achievements({ achievements }: { achievements: { id: string; unlocked_at: string }[] }) {
  const unlockedIds = new Set(achievements.map((a) => a.id));
  const unlocked = ALL_ACHIEVEMENT_IDS.filter((id) => unlockedIds.has(id));
  const locked = ALL_ACHIEVEMENT_IDS.filter((id) => !unlockedIds.has(id));
  const getDate = (id: string) => achievements.find((a) => a.id === id)?.unlocked_at ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-xl font-bold text-white">ДОСТИЖЕНИЯ</h2>
          <p className="text-sm text-muted-foreground font-rajdhani mt-1">{unlocked.length} из {ALL_ACHIEVEMENT_IDS.length} разблокировано</p>
        </div>
        <div className="font-orbitron text-2xl font-black" style={{ color: "#ffd700", textShadow: "0 0 20px #ffd70066" }}>
          {unlocked.length}/{ALL_ACHIEVEMENT_IDS.length}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-card p-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-rajdhani text-muted-foreground uppercase tracking-widest">Прогресс коллекции</span>
          <span className="text-xs font-orbitron" style={{ color: "#ffd700" }}>{Math.round((unlocked.length / ALL_ACHIEVEMENT_IDS.length) * 100)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div className="h-full rounded-full" style={{
            width: `${(unlocked.length / ALL_ACHIEVEMENT_IDS.length) * 100}%`,
            background: "linear-gradient(90deg, #ffd700, #ff8800)",
            boxShadow: "0 0 10px rgba(255,215,0,0.5)",
            transition: "width 1s ease",
          }} />
        </div>
      </div>

      {unlocked.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#00ffaa" }} />
            <span className="font-orbitron text-xs tracking-widest" style={{ color: "#00ffaa" }}>ПОЛУЧЕНО</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {unlocked.map((id, i) => <AchievementCard key={id} achId={id} unlockedAt={getDate(id)} index={i} />)}
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
            {locked.map((id, i) => <AchievementCard key={id} achId={id} unlockedAt="" index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionsPage({ sessions }: { sessions: Session[] }) {
  const avgScore = sessions.length ? Math.round(sessions.reduce((s, g) => s + g.score, 0) / sessions.length) : 0;
  const avgAcc = sessions.length ? Math.round(sessions.reduce((s, g) => s + g.accuracy, 0) / sessions.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-orbitron text-xl font-bold text-white">ИСТОРИЯ СЕССИЙ</h2>
        <p className="text-sm text-muted-foreground font-rajdhani mt-1">Все игровые сессии в БАС</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Средний счёт" value={avgScore} icon="BarChart3" color="#00ffaa" />
        <StatCard label="Средняя точность" value={`${avgAcc}%`} icon="Target" color="#00aaff" />
        <StatCard label="Всего сессий" value={sessions.length} icon="Hash" color="#bf5fff" />
        <StatCard label="Лучший результат" value={sessions.length ? Math.max(...sessions.map((s) => s.score)) : 0} icon="Trophy" color="#ffd700" />
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground font-rajdhani">
          <Icon name="Gamepad2" size={48} className="mx-auto mb-4 opacity-20" />
          <p>Пока нет сессий. Сыграй первую!</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 grid grid-cols-5 text-xs font-orbitron text-muted-foreground">
            <span>ДАТА</span>
            <span className="text-center">СЧЁТ</span>
            <span className="text-center">ВРЕМЯ</span>
            <span className="text-center">ТОЧНОСТЬ</span>
            <span className="text-center">РЕЖИМ</span>
          </div>
          {sessions.map((s, i) => (
            <div key={s.id} className="px-4 py-3 border-b border-white/5 last:border-0 grid grid-cols-5 items-center animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="text-sm font-rajdhani text-white">{s.date}</span>
              <div className="text-center">
                <span className="font-orbitron text-lg font-bold"
                  style={{ color: s.score >= 700 ? "#00ffaa" : s.score >= 500 ? "#ffd700" : "#ff8800", textShadow: s.score >= 700 ? "0 0 10px #00ffaa66" : "none" }}>
                  {s.score}
                </span>
              </div>
              <div className="text-center text-sm font-rajdhani text-muted-foreground">{s.duration} мин</div>
              <div className="text-center">
                <span className="text-sm font-rajdhani font-semibold"
                  style={{ color: s.accuracy >= 90 ? "#00ffaa" : s.accuracy >= 80 ? "#ffd700" : "#ff4444" }}>
                  {s.accuracy}%
                </span>
              </div>
              <div className="text-center">
                <span className="text-xs font-rajdhani px-2 py-0.5 rounded-full"
                  style={{
                    background: s.level === "Сложный" ? "#bf5fff22" : s.level === "Средний" ? "#00aaff22" : "#00ffaa22",
                    color: s.level === "Сложный" ? "#bf5fff" : s.level === "Средний" ? "#00aaff" : "#00ffaa",
                  }}>
                  {s.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardPage({ myXP }: { myXP: number }) {
  const [board, setBoard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}?action=leaderboard&player_id=${encodeURIComponent(PLAYER_ID)}`)
      .then((r) => r.json())
      .then((d) => { setBoard(d.leaderboard || []); setLoading(false); });
  }, []);

  const rankColors = ["#ffd700", "#c0c0c0", "#cd7f32"];
  const rankEmojis = ["🥇", "🥈", "🥉"];
  const me = board.find((e) => e.is_me);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-orbitron text-xl font-bold text-white">ТАБЛИЦА ЛИДЕРОВ</h2>
        <p className="text-sm text-muted-foreground font-rajdhani mt-1">Рейтинг всех 15 студентов по XP</p>
      </div>

      {me && (
        <div className="rounded-lg border px-4 py-3 flex items-center gap-3"
          style={{ borderColor: "#00ffaa44", background: "linear-gradient(135deg, hsl(var(--card)), #00ffaa08)", boxShadow: "0 0 20px #00ffaa18" }}>
          <span className="text-xl">{getAvatarEmoji(me.avatar_id)}</span>
          <span className="font-rajdhani text-sm text-white">Твоя позиция:</span>
          <span className="font-orbitron font-bold" style={{ color: "#00ffaa" }}>#{me.rank}</span>
          <span className="text-muted-foreground font-rajdhani text-sm ml-auto">{me.xp.toLocaleString()} XP</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-rajdhani">
          <Icon name="Loader" size={32} className="mx-auto mb-3 animate-spin opacity-40" />
          Загрузка...
        </div>
      ) : (
        <div className="space-y-2">
          {board.map((entry, i) => {
            const rankColor = rankColors[i] ?? "#555";
            const lvl = getLevelInfo(entry.xp);
            return (
              <div key={entry.player_id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 hover:scale-[1.005] animate-fade-in-up"
                style={{
                  borderColor: entry.is_me ? "#00ffaa44" : "rgba(255,255,255,0.06)",
                  background: entry.is_me ? "linear-gradient(135deg, hsl(var(--card)), #00ffaa08)" : "hsl(var(--card))",
                  boxShadow: i < 3 ? `0 0 14px ${rankColor}22` : "none",
                  animationDelay: `${i * 50}ms`,
                }}>
                {/* Rank */}
                <div className="w-8 text-center font-orbitron text-sm font-bold shrink-0" style={{ color: rankColor }}>
                  {i < 3 ? rankEmojis[i] : `#${entry.rank}`}
                </div>
                {/* Avatar */}
                <div className="text-xl shrink-0">{getAvatarEmoji(entry.avatar_id)}</div>
                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <div className="font-rajdhani font-semibold text-sm truncate" style={{ color: entry.is_me ? "#00ffaa" : "white" }}>
                    {entry.nickname}
                    {entry.is_me && <span className="ml-2 text-xs font-orbitron opacity-70" style={{ color: "#00ffaa" }}>(ты)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">Ур. {lvl.level} · {lvl.title}</div>
                </div>
                {/* XP bar mini */}
                <div className="hidden sm:flex flex-col items-end gap-1 w-32 shrink-0">
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, (entry.xp / 10000) * 100)}%`,
                      background: `linear-gradient(90deg, ${lvl.color}, ${lvl.color}88)`,
                      boxShadow: `0 0 6px ${lvl.color}66`,
                    }} />
                  </div>
                  <div className="font-orbitron text-xs font-bold" style={{ color: rankColor }}>
                    {entry.xp.toLocaleString()} XP
                  </div>
                </div>
                {/* XP mobile */}
                <div className="sm:hidden font-orbitron text-sm font-bold shrink-0" style={{ color: rankColor }}>
                  {entry.xp.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Profile({ profile, onAvatarChange }: { profile: PlayerProfile | null; onAvatarChange: (id: string) => void }) {
  const xp = profile?.xp ?? 0;
  const lvl = getLevelInfo(xp);
  const unlockedAch = profile?.achievements ?? [];
  const [saving, setSaving] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState(profile?.avatar_id ?? "boy_1");

  useEffect(() => {
    if (profile?.avatar_id) setPendingAvatar(profile.avatar_id);
  }, [profile?.avatar_id]);

  const saveAvatar = async (id: string) => {
    setPendingAvatar(id);
    setSaving(true);
    await fetch(`${API}?action=profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: PLAYER_ID, avatar_id: id }),
    });
    setSaving(false);
    onAvatarChange(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-orbitron text-xl font-bold text-white">ПРОФИЛЬ ИГРОКА</h2>
        <p className="text-sm text-muted-foreground font-rajdhani mt-1">Твоя игровая карточка</p>
      </div>

      {/* Profile card */}
      <div className="relative rounded-2xl border overflow-hidden p-6"
        style={{ borderColor: `${lvl.color}44`, background: `linear-gradient(135deg, hsl(var(--card)) 50%, ${lvl.color}08)`, boxShadow: `0 0 40px ${lvl.color}18` }}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
              style={{ background: `${lvl.color}20`, border: `2px solid ${lvl.color}66` }}>
              {getAvatarEmoji(pendingAvatar)}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center font-orbitron text-xs font-bold"
              style={{ background: lvl.color, color: "#0a0d14" }}>
              {lvl.level}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="font-orbitron text-2xl font-black text-white mb-1">{profile?.nickname ?? "..."}</div>
            <div className="font-rajdhani text-sm mb-3" style={{ color: lvl.color }}>{lvl.title} · БАС Арена</div>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-sm font-rajdhani text-muted-foreground">
              <span>🎮 Достижений: {unlockedAch.length}</span>
              <span>⚡ XP: {xp.toLocaleString()}</span>
            </div>
          </div>
          {saving && <div className="text-xs font-rajdhani" style={{ color: "#00ffaa" }}>Сохранение...</div>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Всего XP" value={xp.toLocaleString()} icon="Zap" color="#00ffaa" />
        <StatCard label="Уровень" value={lvl.level} icon="ChevronUp" color={lvl.color} />
        <StatCard label="Достижений" value={`${unlockedAch.length}/${ALL_ACHIEVEMENT_IDS.length}`} icon="Trophy" color="#ffd700" />
      </div>

      {/* Avatar picker */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Smile" size={16} style={{ color: "#00aaff" }} />
          <span className="font-orbitron text-sm text-white">ВЫБОР АВАТАРА</span>
        </div>
        <AvatarPicker current={pendingAvatar} onSelect={saveAvatar} />
      </div>

      {/* Badges */}
      {unlockedAch.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Medal" size={16} style={{ color: "#ffd700" }} />
            <span className="font-orbitron text-sm text-white">МОИ ДОСТИЖЕНИЯ</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {unlockedAch.map((a, i) => {
              const m = ACHIEVEMENTS_META[a.id];
              return m ? (
                <div key={a.id} className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 animate-fade-in-up"
                  style={{ background: `${m.color}15`, border: `1px solid ${m.color}44`, boxShadow: `0 0 12px ${m.color}20`, animationDelay: `${i * 80}ms` }}
                  title={m.title}>
                  <Icon name={m.icon} size={20} style={{ color: m.color }} />
                  <span className="text-[9px] font-orbitron text-center leading-tight" style={{ color: m.color }}>{m.title.split(" ")[0]}</span>
                </div>
              ) : null;
            })}
            {Array.from({ length: ALL_ACHIEVEMENT_IDS.length - unlockedAch.length }).map((_, i) => (
              <div key={`lock-${i}`} className="aspect-square rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Icon name="Lock" size={16} className="text-muted-foreground" style={{ opacity: 0.4 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Index() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [xpPopup, setXpPopup] = useState<{ xp: number; achs: string[]; penalty: number } | null>(null);

  const loadProfile = useCallback(async () => {
    const res = await fetch(`${API}?action=profile&player_id=${encodeURIComponent(PLAYER_ID)}`);
    if (res.ok) {
      const d = await res.json();
      setProfile(d);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    const res = await fetch(`${API}?action=sessions&player_id=${encodeURIComponent(PLAYER_ID)}`);
    if (res.ok) {
      const d = await res.json();
      setSessions(d.sessions || []);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadSessions();
  }, [loadProfile, loadSessions]);

  const handleSessionSuccess = (xp: number, achs: string[], penalty: number) => {
    setXpPopup({ xp, achs, penalty });
    loadProfile();
    loadSessions();
    setActiveTab("dashboard");
  };

  const handleAvatarChange = (avatarId: string) => {
    setProfile((p) => p ? { ...p, avatar_id: avatarId } : p);
  };

  const lvl = getLevelInfo(profile?.xp ?? 0);

  return (
    <div className="min-h-screen bg-background grid-bg scanlines">
      {/* XP Popup */}
      {xpPopup && <XPPopup xp={xpPopup.xp} achievements={xpPopup.achs} penalty={xpPopup.penalty} onClose={() => setXpPopup(null)} />}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md" style={{ background: "rgba(10,13,22,0.92)" }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
              style={{ background: "#00ffaa20", border: "1px solid #00ffaa44" }}>
              <Icon name="Gamepad2" size={16} style={{ color: "#00ffaa" }} />
            </div>
            <span className="font-orbitron text-sm font-bold text-white animate-flicker" style={{ letterSpacing: "0.1em" }}>
              БАС<span style={{ color: "#00ffaa" }}>_</span>АРЕНА
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-orbitron transition-all duration-200"
                style={{
                  color: activeTab === item.id ? lvl.color : "#666",
                  background: activeTab === item.id ? `${lvl.color}15` : "transparent",
                  borderBottom: activeTab === item.id ? `1px solid ${lvl.color}` : "1px solid transparent",
                }}>
                <Icon name={item.icon} size={13} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* XP pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: `${lvl.color}15`, border: `1px solid ${lvl.color}33` }}>
            <span className="text-xl">{getAvatarEmoji(profile?.avatar_id ?? "boy_1")}</span>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: lvl.color }} />
            <span className="font-orbitron text-xs" style={{ color: lvl.color }}>
              LVL {lvl.level} · {(profile?.xp ?? 0).toLocaleString()} XP
            </span>
          </div>

          {/* Mobile button */}
          <button className="md:hidden p-2 rounded-lg" style={{ background: "#00ffaa15", color: "#00ffaa" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={18} />
          </button>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 grid grid-cols-6 gap-1"
            style={{ background: "rgba(10,13,22,0.98)" }}>
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg font-orbitron transition-all"
                style={{ color: activeTab === item.id ? lvl.color : "#666", background: activeTab === item.id ? `${lvl.color}15` : "transparent" }}>
                <Icon name={item.icon} size={16} />
                <span className="text-[9px]">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 pt-20 pb-10">
        <div key={activeTab} className="animate-fade-in">
          {activeTab === "dashboard"    && <Dashboard profile={profile} sessions={sessions} onTabChange={setActiveTab} />}
          {activeTab === "new-session"  && <NewSession onSuccess={handleSessionSuccess} />}
          {activeTab === "achievements" && <Achievements achievements={profile?.achievements ?? []} />}
          {activeTab === "sessions"     && <SessionsPage sessions={sessions} />}
          {activeTab === "leaderboard"  && <LeaderboardPage myXP={profile?.xp ?? 0} />}
          {activeTab === "profile"      && <Profile profile={profile} onAvatarChange={handleAvatarChange} />}
        </div>
      </main>
    </div>
  );
}