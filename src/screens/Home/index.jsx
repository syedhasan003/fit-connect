import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import ProfileDropdown from "../../components/ProfileDropdown";
import { fetchHomeOverview } from "../../api/home";
import { fetchReminders } from "../../api/reminders";
import { useAuth } from "../../auth/AuthContext";
import { getWeekAdherence, getWeightHistory, logWeight } from "../../api/health";
import { getMorningBrief } from "../../api/agent";
import { useAgent } from "../../context/AgentContext";
import AgentStatusPill from "../../components/agent/AgentStatusPill";

export default function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [reminderCount, setReminderCount] = useState(0);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [weekDays, setWeekDays] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightDraft, setWeightDraft] = useState('');
  const [morningBrief, setMorningBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(true);

  // Agent presence — flash header when a new event fires
  const { lastEvent } = useAgent();
  const [headerFlashKey, setHeaderFlashKey] = useState(0);
  useEffect(() => {
    if (lastEvent) setHeaderFlashKey(k => k + 1);
  }, [lastEvent]);

  // Refetch whenever the tab becomes visible again (handles back-navigation from meal logging)
  useEffect(() => {
    loadData();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadData();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const loadData = async () => {
    try {
      const homeData = await fetchHomeOverview();
      console.log('✅ Home data received:', homeData);
      setData(homeData);

      // Load reminder count
      try {
        const reminderData = await fetchReminders();
        setReminderCount(reminderData.length);
      } catch (reminderError) {
        console.warn('⚠️ Failed to load reminders:', reminderError);
      }

      // Load week adherence + weight history (non-blocking)
      getWeekAdherence().then(r => setWeekDays(r?.days || [])).catch(() => {});
      getWeightHistory(14).then(r => setWeightHistory(r || [])).catch(() => {});

      // Load morning brief (non-blocking)
      getMorningBrief()
        .then(r => setMorningBrief(r?.available ? r : null))
        .catch(() => setMorningBrief(null))
        .finally(() => setBriefLoading(false));

    } catch (err) {
      console.error('❌ Home fetch error:', err);

      if (err.message.includes('Authentication failed') || err.message.includes('401')) {
        console.log('🚪 Auth failed - logging out...');
        logout();
        navigate('/login', { replace: true });
      } else {
        setError(err.message);
      }
    }
  };

  const handleLogWeight = async () => {
    const kg = parseFloat(weightDraft);
    if (!kg || kg < 20 || kg > 300) return;
    try {
      await logWeight(kg);
      const updated = await getWeightHistory(14);
      setWeightHistory(updated || []);
      setWeightDraft('');
      setShowWeightInput(false);
    } catch (e) { console.warn('Weight log failed', e); }
  };

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        padding: 20,
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Error Loading Home</h2>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <LoadingState />;

  const user = data.user || {};
  const name = user.full_name || user.email?.split("@")[0] || "User";
  const today = data.today || { workout: "pending", diet: {}, reminders: { missed: 0 } };
  const consistency = data.consistency || [];
  const aiSummary = data.evaluator?.ai_summary || "Keep showing up. Momentum compounds.";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      paddingBottom: "100px",
    }}>
      {/* HEADER — flashes a subtle purple glow whenever a new agent event fires */}
      <header
        key={headerFlashKey}
        style={{
          padding: "24px 20px 20px",
          position: "relative",
          animation: headerFlashKey > 0 ? "agentFlash 1.2s ease-out forwards" : "none",
        }}>
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            cursor: "pointer",
            position: "relative",
            width: "fit-content",
          }}
        >
          <div style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))",
            border: "2px solid rgba(139, 92, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.2)",
            position: "relative",
            transition: "all 0.2s ease",
            transform: isDropdownOpen ? "scale(1.05)" : "scale(1)",
          }}>
            <div style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              opacity: 0.3,
              filter: "blur(8px)",
              animation: "pulse 3s ease-in-out infinite",
            }} />
            <span style={{ position: "relative", zIndex: 1 }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}>
              {name}
            </h1>
            <p style={{
              margin: "2px 0 0",
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              fontWeight: 450,
            }}>
              Dashboard overview
            </p>
          </div>
        </div>

        {/* Profile Dropdown */}
        <ProfileDropdown
          userName={name}
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
        />
      </header>

      <div style={{ padding: "0 20px" }}>

        {/* AGENT STATUS PILL — always visible, shows agent is alive */}
        <AgentStatusPill />

        {/* TODAY SECTION */}
        <SectionHeader title="Today" />
        <TodayCard
          data={today}
          navigate={navigate}
          user={user}
        />

        {/* BRIEF — subtle text below today card */}
        <DayBrief today={today} user={user} weekDays={weekDays} weightHistory={weightHistory} />

        {/* MORNING BRIEF — AI-generated daily brief card */}
        <MorningBriefCard brief={morningBrief} loading={briefLoading} onAskMore={() => navigate("/central")} />

        {/* REMINDERS SUMMARY */}
        {reminderCount > 0 && (
          <>
            <SectionHeader title="Reminders" />
            <ReminderSummaryCard
              count={reminderCount}
              onClick={() => navigate("/reminders")}
            />
          </>
        )}

        {/* CREATE SECTION */}
        <SectionHeader title="Create" />
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 32,
        }}>
          <CreateCard
            icon="🏋️"
            label="CREATE"
            title="Workout"
            link="Manual builder →"
            color="#8b5cf6"
            onClick={() => navigate("/workout-builder")}
          />
          <CreateCard
            icon="🍽️"
            label="CREATE"
            title="Diet Plan"
            link="Manual builder →"
            color="#6366f1"
            onClick={() => navigate("/diet-builder")}
          />
        </div>

        {/* PROGRESS SECTION */}
        <SectionHeader title="Progress" />
        <ProgressCard consistency={consistency} onViewProgress={() => navigate("/progress")} />

        {/* AI INSIGHT SECTION */}
        <SectionHeader title="AI Insight" />
        <AIInsightCard insight={aiSummary} />
      </div>

      <BottomNav />

      <style>{`
        @keyframes agentFlash {
          0%   { box-shadow: 0 0 0px 0px rgba(139,92,246,0); }
          30%  { box-shadow: 0 0 40px 18px rgba(139,92,246,0.22); }
          100% { box-shadow: 0 0 0px 0px rgba(139,92,246,0); }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes borderGlow {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0%, 100% {
            transform: translateX(-50%);
            opacity: 0.4;
          }
          50% {
            transform: translateX(50%);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Morning Brief Card ──────────────────────────────────────────────────────
function MorningBriefCard({ brief, loading, onAskMore }) {
  const [expanded, setExpanded] = useState(false);

  // Don't render anything during load or if the brief API isn't ready yet
  // (scheduler hasn't run for the first time)
  if (loading) return null;
  if (!brief) return null;

  const text = brief.brief || "";
  const stats = brief.stats || {};
  const isLong = text.length > 220;
  const displayText = isLong && !expanded ? text.slice(0, 220).trimEnd() + "…" : text;

  // Strip markdown headers (##) for clean inline display
  const cleanText = displayText.replace(/^#+\s*/gm, "").trim();

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Label row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 10,
      }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
          boxShadow: "0 0 8px rgba(251,191,36,0.5)",
        }} />
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          letterSpacing: 1.4,
        }}>
          Morning Brief
        </span>
        {brief.date && (
          <span style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.2)",
            marginLeft: "auto",
            fontWeight: 500,
          }}>
            {brief.date}
          </span>
        )}
      </div>

      {/* Card */}
      <div style={{
        borderRadius: 18,
        padding: "18px 20px",
        background: "linear-gradient(135deg, rgba(17,24,39,0.55), rgba(10,10,12,0.7))",
        border: "1px solid rgba(251,191,36,0.12)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle amber top accent */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.35), transparent)",
        }} />

        {/* Brief text */}
        <p style={{
          fontSize: 14.5,
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.82)",
          margin: "0 0 0 0",
          fontWeight: 400,
          letterSpacing: 0.1,
          whiteSpace: "pre-line",
        }}>
          {cleanText}
        </p>

        {/* Expand / collapse */}
        {isLong && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(251,191,36,0.7)",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              padding: "6px 0 0",
              letterSpacing: 0.3,
            }}
          >
            {expanded ? "Show less ↑" : "Read more ↓"}
          </button>
        )}

        {/* Quick stats strip (if available) */}
        {(stats.streak_days > 0 || stats.sessions_this_week > 0 || stats.avg_calories > 0) && (
          <div style={{
            display: "flex",
            gap: 20,
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}>
            {stats.streak_days > 0 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>
                  {stats.streak_days}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>
                    day streak
                  </span>
                </div>
              </div>
            )}
            {stats.sessions_this_week > 0 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>
                  {stats.sessions_this_week}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>
                    sessions
                  </span>
                </div>
              </div>
            )}
            {stats.avg_calories > 0 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>
                  {stats.avg_calories}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>
                    avg kcal
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ask Central button */}
        <button
          onClick={onAskMore}
          style={{
            marginTop: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "transparent",
            border: "none",
            color: "rgba(251,191,36,0.55)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            letterSpacing: 0.3,
          }}
        >
          Ask Central for more →
        </button>
      </div>
    </div>
  );
}

// ─── Day Brief ──────────────────────────────────────────────────────────────
function DayBrief({ today, user, weekDays, weightHistory }) {
  const completedDays = weekDays.filter(d => d.completed).length;
  const workoutStatus = today?.workout || 'not_set';
  const calories = today?.diet?.calories || { logged: 0, target: 0 };
  const calPct = calories.target > 0 ? Math.round((calories.logged / calories.target) * 100) : 0;
  const lastWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null;

  const lines = [];
  if (workoutStatus === 'completed') lines.push("Workout done today — solid.");
  else if (workoutStatus === 'in_progress') lines.push("Workout in progress. Keep going.");
  else if (workoutStatus === 'rest_day') lines.push("Rest day. Recover well.");
  else if (user?.active_workout_program_id) lines.push("Your workout is waiting.");

  if (calories.target > 0) {
    if (calPct >= 90) lines.push(`Nutrition on point — ${calPct}% of target hit.`);
    else if (calPct > 0) lines.push(`${calories.logged} of ${calories.target} kcal logged.`);
    else lines.push("No meals logged yet.");
  }

  if (completedDays > 0) lines.push(`${completedDays} session${completedDays > 1 ? 's' : ''} this week.`);
  if (lastWeight) lines.push(`${lastWeight.weight_kg} kg.`);

  if (lines.length === 0) return null;

  return (
    <p style={{
      fontSize: 13,
      color: "rgba(255,255,255,0.38)",
      lineHeight: 1.7,
      margin: "0 0 28px",
      fontWeight: 450,
      letterSpacing: 0.1,
    }}>
      {lines.join('  ·  ')}
    </p>
  );
}

// ─── Week Adherence Strip ───────────────────────────────────────────────────
function WeekAdherenceStrip({ days }) {
  return (
    <div style={{
      marginBottom: 20, padding: '18px 20px',
      background: 'linear-gradient(135deg, rgba(17,24,39,0.7), rgba(10,10,12,0.8))',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
    }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
        This Week
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        {days.map((d) => {
          const isPast    = d.is_past && !d.is_today;
          const isToday   = d.is_today;
          const isDone    = d.completed;
          const isMissed  = isPast && !isDone;

          let bg = 'rgba(255,255,255,0.05)';
          let border = '1.5px solid rgba(255,255,255,0.07)';
          let glow = 'none';
          let textColor = 'rgba(255,255,255,0.2)';

          if (isDone) {
            bg = 'linear-gradient(135deg, #4338ca, #6366f1)';
            border = '1.5px solid #6366f1';
            glow = '0 0 12px rgba(99,102,241,0.5)';
            textColor = '#fff';
          } else if (isMissed) {
            bg = 'rgba(239,68,68,0.08)';
            border = '1.5px solid rgba(239,68,68,0.25)';
            textColor = 'rgba(239,68,68,0.5)';
          } else if (isToday) {
            border = '1.5px solid rgba(99,102,241,0.6)';
            textColor = '#818cf8';
          }

          return (
            <div key={d.weekday} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', aspectRatio: '1',
                borderRadius: 10,
                background: bg, border, boxShadow: glow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {isDone && (
                  <svg width={14} height={14} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 8 6 12 13 4" />
                  </svg>
                )}
                {isToday && !isDone && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8' }} />
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: textColor, letterSpacing: 0.3 }}>
                {d.short_name.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Body Weight Card ────────────────────────────────────────────────────────
function BodyWeightCard({ weightHistory, showInput, draft, onDraftChange, onToggle, onSubmit }) {
  const latest = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1] : null;
  const trend  = weightHistory.length >= 2
    ? (weightHistory[weightHistory.length - 1].weight_kg - weightHistory[0].weight_kg).toFixed(1)
    : null;

  // Mini sparkline
  const W = 80, H = 28;
  const sparkline = (() => {
    if (weightHistory.length < 2) return null;
    const vals = weightHistory.slice(-7).map(e => e.weight_kg);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x},${y}`;
    }).join(' ');
    return pts;
  })();

  return (
    <div style={{
      marginBottom: 20, padding: '18px 20px',
      background: 'linear-gradient(135deg, rgba(17,24,39,0.8), rgba(10,10,12,0.9))',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            Body Weight
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#f0f0f4', letterSpacing: -1 }}>
              {latest ? `${latest.weight_kg}` : '—'}
            </span>
            {latest && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>kg</span>}
          </div>
          {trend !== null && (
            <div style={{ fontSize: 11, color: parseFloat(trend) > 0 ? '#f87171' : '#34d399', fontWeight: 700, marginTop: 2 }}>
              {parseFloat(trend) > 0 ? '+' : ''}{trend} kg over {Math.min(weightHistory.length, 7)} logs
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {sparkline && (
            <svg width={W} height={H} style={{ opacity: 0.7 }}>
              <polyline points={sparkline} fill="none" stroke="#818cf8" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          )}
          <button onClick={onToggle} style={{
            padding: '6px 14px', borderRadius: 100,
            background: showInput ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
            border: showInput ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.1)',
            color: showInput ? '#818cf8' : 'rgba(255,255,255,0.6)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            {showInput ? 'Cancel' : '+ Log'}
          </button>
        </div>
      </div>

      {showInput && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input
            type="number"
            placeholder="e.g. 74.5"
            value={draft}
            onChange={e => onDraftChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            style={{
              flex: 1, padding: '11px 14px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 10, color: '#f0f0f4', fontSize: 15, fontWeight: 700, outline: 'none',
            }}
            autoFocus
          />
          <button onClick={onSubmit} style={{
            padding: '11px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg, #4338ca, #6366f1)',
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function ReminderSummaryCard({ count, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 18,
        padding: "20px",
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        marginBottom: 16,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h3 style={{
            margin: "0 0 6px",
            fontSize: 17,
            fontWeight: 600,
          }}>
            You have {count} active reminder{count !== 1 ? 's' : ''}
          </h3>
          <p style={{
            margin: 0,
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
          }}>
            Tap to view all
          </p>
        </div>
        <div style={{
          fontSize: 24,
          color: "#8b5cf6",
        }}>
          →
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
    }}>
      <div style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            animation: "bounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <h2 style={{
      fontSize: 19,
      fontWeight: 600,
      marginTop: 32,
      marginBottom: 14,
      letterSpacing: 0.3,
    }}>
      {title}
    </h2>
  );
}

function TodayCard({ data, navigate, user }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Helper to get workout display
  const getWorkoutDisplay = () => {
    const status = data.workout || "not_set";

    switch (status) {
      case "completed":
        return { value: "Completed", status: "success", icon: "✅" };
      case "in_progress":
        return { value: "In Progress", status: "in_progress", icon: "🏋️" };
      case "pending":
        return { value: "Pending", status: "pending", icon: "⏳" };
      case "rest_day":
        return { value: "Rest Day", status: "rest", icon: "🌙" };
      case "not_set":
        return { value: "Not Set", status: "muted", icon: "➕" };
      default:
        return { value: "Pending", status: "pending", icon: "⏳" };
    }
  };

  // Helper to get diet display
  const getDietDisplay = () => {
    const dietData = data.diet || {};
    const status = dietData.status || "not_set";
    const calories = dietData.calories || { logged: 0, target: 0 };

    switch (status) {
      case "completed":
        return {
          value: `${calories.logged}/${calories.target} cal`,
          status: "success",
          icon: "✅"
        };
      case "in_progress":
        return {
          value: `${calories.logged}/${calories.target} cal`,
          status: "in_progress",
          icon: "🍽️"
        };
      case "pending":
        return {
          value: `0/${calories.target} cal`,
          status: "pending",
          icon: "⏳"
        };
      case "not_set":
        return { value: "Not Set", status: "muted", icon: "➕" };
      default:
        return { value: "Not Set", status: "muted", icon: "➕" };
    }
  };

  const workoutDisplay = getWorkoutDisplay();
  const dietDisplay = getDietDisplay();

  // Define items with click handlers
  const items = [
    {
      label: "Workout",
      value: workoutDisplay.value,
      status: workoutDisplay.status,
      icon: workoutDisplay.icon,
      onClick: () => {
        // Check if user has active workout program
        if (user.active_workout_program_id) {
          // Go to workout tracking/session page
          navigate('/workout-tracking');  // ✅ FIXED PATH
        } else {
          // Go to workout builder for first-time setup
          navigate('/workout-builder');
        }
      },
    },
    {
      label: "Diet",
      value: dietDisplay.value,
      status: dietDisplay.status,
      icon: dietDisplay.icon,
      onClick: () => {
        // Check if user has active diet plan
        if (user.active_diet_plan_id) {
          // Go to meal logging page
          navigate('/meal-logging');  // ✅ FIXED PATH
        } else {
          // Go to diet builder for first-time setup
          navigate('/diet-builder');
        }
      },
    },
    {
      label: "Reminders",
      value: `${data.reminders?.missed || 0} missed`,
      status: (data.reminders?.missed || 0) > 0 ? "warning" : "muted",
      icon: (data.reminders?.missed || 0) > 0 ? "⚠️" : "✅",
      onClick: () => navigate('/reminders'),
    },
  ];

  return (
    <div style={{
      position: "relative",
      borderRadius: 20,
      padding: "18px 20px",
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
      backdropFilter: "blur(12px)",
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        padding: "1px",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.4))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        inset: -20,
        background: "conic-gradient(from 0deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)",
        animation: "rotate 8s linear infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {items.map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 8px",
              borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              cursor: "pointer",
              background: hoveredIndex === i
                ? "rgba(139, 92, 246, 0.1)"
                : "transparent",
              borderRadius: 8,
              transition: "all 0.2s ease",
              transform: hoveredIndex === i ? "translateX(4px)" : "translateX(0)",
            }}
          >
            <span style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 450,
            }}>
              {item.label}
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{
                fontSize: 14,
                fontWeight: 500,
                color: item.status === "success"
                  ? "#10b981"
                  : item.status === "warning"
                  ? "#f59e0b"
                  : item.status === "pending"
                  ? "#8b5cf6"
                  : item.status === "in_progress"
                  ? "#3b82f6"
                  : item.status === "rest"
                  ? "#6b7280"
                  : "rgba(255,255,255,0.5)",
              }}>
                {item.value}
              </span>
              {hoveredIndex === i && (
                <span style={{
                  fontSize: 16,
                  color: "#8b5cf6",
                  transition: "all 0.2s ease",
                }}>
                  →
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateCard({ icon, label, title, link, color, onClick }) {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "18px 16px",
        background: isHover
          ? `linear-gradient(135deg, rgba(17, 24, 39, 0.7), rgba(31, 41, 55, 0.5))`
          : "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHover ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: isHover
          ? `0 12px 32px ${color}25, 0 0 0 1px ${color}15`
          : "none",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 18,
        padding: "1px",
        background: isHover
          ? `linear-gradient(135deg, ${color}60, transparent)`
          : `linear-gradient(135deg, ${color}20, transparent)`,
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        transition: "background 0.3s ease",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "100%",
        background: `linear-gradient(135deg, ${color}15, transparent)`,
        opacity: isHover ? 1 : 0,
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontSize: 32,
          marginBottom: 8,
          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
        }}>
          {icon}
        </div>
        <p style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 6,
          fontWeight: 600,
        }}>
          {label}
        </p>
        <h3 style={{
          fontSize: 17,
          fontWeight: 600,
          margin: "0 0 8px",
          letterSpacing: 0.3,
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          margin: 0,
          fontWeight: 450,
        }}>
          {link}
        </p>
      </div>
    </div>
  );
}

function ProgressCard({ consistency, onViewProgress }) {
  if (!consistency || consistency.length === 0) {
    consistency = Array(14).fill({ worked_out: false });
  }

  return (
    <div style={{
      position: "relative",
      borderRadius: 20,
      padding: "24px 20px",
      background: "linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(31, 41, 55, 0.3))",
      backdropFilter: "blur(12px)",
      textAlign: "center",
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        padding: "1px",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 16,
        }}>
          {consistency.map((d, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: d.worked_out
                  ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                  : "rgba(255, 255, 255, 0.08)",
                boxShadow: d.worked_out ? "0 0 12px rgba(139, 92, 246, 0.6)" : "none",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          margin: 0,
          fontWeight: 500,
          letterSpacing: 0.3,
        }}>
          Consistency (last 14 days)
        </p>

        {/* Weekly Progress deep-link */}
        {onViewProgress && (
          <button
            onClick={onViewProgress}
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(139,92,246,0.35)",
              background: "rgba(139,92,246,0.1)",
              color: "#a78bfa",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: 0.3,
            }}
          >
            View weekly details →
          </button>
        )}
      </div>
    </div>
  );
}

function AIInsightCard({ insight }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 20,
      padding: "20px",
      background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.08))",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
      marginBottom: 24,
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: "20%",
        right: "20%",
        height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), transparent)",
        borderRadius: "2px",
        animation: "shimmer 3s ease-in-out infinite",
      }} />

      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 20,
        padding: "1px",
        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4))",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "borderGlow 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            boxShadow: "0 0 12px rgba(139, 92, 246, 0.6)",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            background: "linear-gradient(135deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}>
            Central AI
          </span>
        </div>

        <p style={{
          fontSize: 14.5,
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.85)",
          margin: 0,
          fontWeight: 450,
          letterSpacing: 0.2,
        }}>
          {insight}
        </p>
      </div>
    </div>
  );
}