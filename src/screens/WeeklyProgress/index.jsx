import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import BottomNav from "../../components/navigation/BottomNav";
import {
  getWeeklyWorkoutStats,
  getWeekSessions,
  getWeeklyNutritionStats,
  getWeightHistory,
  getWaterToday,
} from "../../api/progress";
import { getWeeklyAdaptation, getCorrelations } from "../../api/agent";

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtMins(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

function getWeekRange() {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function weightDelta(history) {
  if (!history || history.length < 2) return null;
  const delta = history[history.length - 1].weight_kg - history[0].weight_kg;
  return Math.round(delta * 10) / 10;
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(17,24,39,0.6), rgba(31,41,55,0.4))",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 22,
        padding: "20px 20px",
        backdropFilter: "blur(20px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: "rgba(255,255,255,0.38)",
        textTransform: "uppercase",
        letterSpacing: 1.4,
        margin: "0 0 14px 0",
      }}
    >
      {children}
    </p>
  );
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 20, r = 8 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmerLoad 1.4s ease-in-out infinite",
      }}
    />
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function WeeklyProgress() {
  const navigate = useNavigate();

  const [workoutStats, setWorkoutStats]   = useState(null);
  const [weekDays,     setWeekDays]       = useState([]);
  const [nutrition,    setNutrition]      = useState(null);
  const [weightData,   setWeightData]     = useState([]);
  const [water,        setWater]          = useState(null);
  const [loading,      setLoading]        = useState(true);
  const [adaptation,   setAdaptation]     = useState(null);
  const [correlations, setCorrelations]   = useState(null);

  useEffect(() => {
    const load = async () => {
      const [ws, wd, nt, wt, wa, ad, co] = await Promise.allSettled([
        getWeeklyWorkoutStats(),
        getWeekSessions(),
        getWeeklyNutritionStats(),
        getWeightHistory(14),
        getWaterToday(),
        getWeeklyAdaptation(),
        getCorrelations(),
      ]);
      if (ws.status === "fulfilled") setWorkoutStats(ws.value);
      if (wd.status === "fulfilled") setWeekDays(wd.value?.days || []);
      if (nt.status === "fulfilled") setNutrition(nt.value);
      if (wt.status === "fulfilled") setWeightData(wt.value || []);
      if (wa.status === "fulfilled") setWater(wa.value);
      if (ad.status === "fulfilled" && ad.value?.available) setAdaptation(ad.value);
      if (co.status === "fulfilled" && co.value?.available) setCorrelations(co.value);
      setLoading(false);
    };
    load();
  }, []);

  const delta = weightDelta(weightData);

  // Chart data — label only every other point if dense
  const chartData = weightData.map((e) => ({
    date: new Date(e.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: e.weight_kg,
  }));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        paddingBottom: 100,
        fontFamily: "inherit",
      }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "52px 22px 16px 22px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(139,92,246,0.85)",
            fontSize: 26,
            cursor: "pointer",
            padding: 0,
            marginBottom: 10,
            display: "block",
          }}
        >
          ←
        </button>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: 0.2 }}>
              Weekly Progress
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>
              {getWeekRange()}
            </p>
          </div>

          {/* AI analysis CTA */}
          <button
            onClick={() =>
              navigate("/central", { state: { preset: "Analyze my progress" } })
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 999,
              border: "1px solid rgba(139,92,246,0.4)",
              background: "rgba(139,92,246,0.1)",
              color: "#c4b5fd",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: 0.2,
              whiteSpace: "nowrap",
            }}
          >
            <span>✦</span> AI Analysis
          </button>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── 1. WEEK TRACKER ─────────────────────────────────────────────── */}
        <Card>
          <SectionLabel>This Week</SectionLabel>

          {loading ? (
            <Skeleton h={52} r={14} />
          ) : (
            <>
              <WeekDots days={weekDays} />

              {/* Stat chips */}
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                {[
                  { label: "Sessions",   value: workoutStats?.total_workouts ?? "—",        accent: "#8b5cf6" },
                  { label: "Total time", value: fmtMins(workoutStats?.total_minutes ?? 0),  accent: "#06b6d4" },
                  { label: "Avg session",value: fmtMins(Math.round(workoutStats?.avg_duration ?? 0)), accent: "#10b981" },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${s.accent}25`,
                      borderRadius: 14,
                      padding: "12px 10px",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: s.accent }}>
                      {s.value}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* ── 2. NUTRITION ────────────────────────────────────────────────── */}
        <Card>
          <SectionLabel>Nutrition · Avg daily</SectionLabel>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton h={28} />
              <Skeleton h={14} />
              <Skeleton h={14} />
              <Skeleton h={14} />
            </div>
          ) : nutrition && nutrition.days_logged > 0 ? (
            <>
              {/* Big calorie number */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 18 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>
                  {Math.round(nutrition.avg_calories).toLocaleString()}
                </span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                  kcal
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.35)",
                    fontWeight: 500,
                  }}
                >
                  {nutrition.days_logged}/7 days logged
                </span>
              </div>

              {/* Macro bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <MacroBar label="Protein" grams={nutrition.avg_protein} max={200} color="#8b5cf6" />
                <MacroBar label="Carbs"   grams={nutrition.avg_carbs}   max={350} color="#06b6d4" />
                <MacroBar label="Fats"    grams={nutrition.avg_fats}    max={100} color="#f59e0b" />
              </div>
            </>
          ) : (
            <EmptyState icon="🥗" message="No meals logged this week yet." />
          )}
        </Card>

        {/* ── 3. WEIGHT TREND ─────────────────────────────────────────────── */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <SectionLabel style={{ margin: 0 }}>Weight Trend</SectionLabel>
            {delta !== null && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: delta < 0 ? "#10b981" : delta > 0 ? "#f87171" : "rgba(255,255,255,0.5)",
                  background:
                    delta < 0
                      ? "rgba(16,185,129,0.12)"
                      : delta > 0
                      ? "rgba(248,113,113,0.12)"
                      : "rgba(255,255,255,0.06)",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: `1px solid ${delta < 0 ? "rgba(16,185,129,0.3)" : delta > 0 ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {delta > 0 ? "▲" : delta < 0 ? "▼" : "→"} {Math.abs(delta)} kg
              </span>
            )}
          </div>

          {loading ? (
            <Skeleton h={120} r={14} />
          ) : chartData.length >= 2 ? (
            <WeightChart data={chartData} />
          ) : (
            <EmptyState icon="⚖️" message="Log your weight a few times to see the trend." />
          )}
        </Card>

        {/* ── 4. WATER ────────────────────────────────────────────────────── */}
        <Card>
          <SectionLabel>Water Today</SectionLabel>

          {loading ? (
            <Skeleton h={40} r={14} />
          ) : water ? (
            <WaterTracker glasses={water.glasses} target={water.target_glasses} />
          ) : (
            <EmptyState icon="💧" message="No water logged yet today." />
          )}
        </Card>

        {/* ── 5. CORRELATION INSIGHTS ─────────────────────────────────────── */}
        {!loading && correlations && correlations.insights?.length > 0 && (
          <Card style={{ borderColor: "rgba(99,102,241,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 8px rgba(99,102,241,0.5)",
              }} />
              <SectionLabel style={{ margin: 0 }}>Data Insights</SectionLabel>
              <span style={{
                marginLeft: "auto", fontSize: 10, fontWeight: 600,
                color: "rgba(255,255,255,0.25)", letterSpacing: 0.8,
              }}>
                {correlations.days_analysed} days analysed
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {correlations.insights.map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "11px 14px",
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.1)",
                  borderRadius: 12,
                }}>
                  <span style={{ fontSize: 15, lineHeight: 1, marginTop: 1 }}>🔍</span>
                  <p style={{
                    margin: 0, fontSize: 13.5, lineHeight: 1.55,
                    color: "rgba(255,255,255,0.78)", fontWeight: 400,
                  }}>
                    {item.insight}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── 6. WEEKLY ADAPTATION REPORT ─────────────────────────────────── */}
        {!loading && adaptation && (
          <Card style={{ borderColor: "rgba(139,92,246,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
                boxShadow: "0 0 8px rgba(139,92,246,0.5)",
              }} />
              <SectionLabel style={{ margin: 0 }}>Weekly Adaptation</SectionLabel>
              {adaptation.date && (
                <span style={{
                  marginLeft: "auto", fontSize: 10.5, fontWeight: 500,
                  color: "rgba(255,255,255,0.25)",
                }}>
                  {adaptation.date}
                </span>
              )}
            </div>

            {/* Adherence badges */}
            {adaptation.adherence && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Workout", val: adaptation.adherence.workout_adherence_pct, color: "#8b5cf6" },
                  { label: "Nutrition", val: adaptation.adherence.meal_adherence_pct, color: "#10b981" },
                ].map(({ label, val, color }) => (
                  val !== undefined && (
                    <div key={label} style={{
                      flex: 1, padding: "10px 12px",
                      background: `${color}10`,
                      border: `1px solid ${color}25`,
                      borderRadius: 12,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: -0.5 }}>
                        {val}%
                      </div>
                      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", fontWeight: 600, marginTop: 2 }}>
                        {label}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Adaptation report text */}
            {adaptation.report && (
              <p style={{
                margin: 0, fontSize: 13.5, lineHeight: 1.65,
                color: "rgba(255,255,255,0.72)", fontWeight: 400,
                whiteSpace: "pre-line",
              }}>
                {/* Strip markdown headers for clean display */}
                {adaptation.report.replace(/^#+\s*/gm, "").trim()}
              </p>
            )}
          </Card>
        )}

      </div>

      <BottomNav />

      <style>{`
        @keyframes shimmerLoad {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes todayPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(139,92,246,0);  }
        }
      `}</style>
    </div>
  );
}

// ─── 7-day dot tracker ────────────────────────────────────────────────────────
function WeekDots({ days }) {
  if (!days.length) {
    // fallback empty state
    const names = ["M","T","W","T","F","S","S"];
    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        {names.map((n, i) => (
          <DotDay key={i} shortName={n} completed={false} isToday={false} isPast={false} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
      {days.map((d) => (
        <DotDay
          key={d.weekday}
          shortName={d.short_name}
          completed={d.completed}
          isToday={d.is_today}
          isPast={d.is_past}
          sessionDuration={d.session?.duration_minutes}
        />
      ))}
    </div>
  );
}

function DotDay({ shortName, completed, isToday, isPast, sessionDuration }) {
  const dotColor = completed
    ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
    : isToday
    ? "rgba(139,92,246,0.25)"
    : isPast
    ? "rgba(255,255,255,0.06)"
    : "rgba(255,255,255,0.04)";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flex: 1 }}
      title={sessionDuration ? `${sessionDuration} min` : undefined}
    >
      {/* Dot */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: dotColor,
          border: isToday
            ? "2px solid rgba(139,92,246,0.7)"
            : completed
            ? "none"
            : "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: isToday ? "todayPulse 2.5s ease-in-out infinite" : "none",
          transition: "all 0.3s ease",
        }}
      >
        {completed && (
          <span style={{ fontSize: 16, lineHeight: 1 }}>✓</span>
        )}
      </div>

      {/* Day label */}
      <span
        style={{
          fontSize: 11,
          fontWeight: isToday ? 700 : 500,
          color: isToday
            ? "#a78bfa"
            : completed
            ? "rgba(255,255,255,0.7)"
            : "rgba(255,255,255,0.3)",
          letterSpacing: 0.3,
        }}
      >
        {shortName}
      </span>
    </div>
  );
}

// ─── Macro bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, grams, max, color }) {
  const pct = Math.min((grams / max) * 100, 100);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
          fontSize: 12.5,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{Math.round(grams)}g</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${color}90, ${color})`,
            transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Recharts weight sparkline ────────────────────────────────────────────────
function WeightChart({ data }) {
  const min = Math.min(...data.map((d) => d.weight)) - 1;
  const max = Math.max(...data.map((d) => d.weight)) + 1;

  return (
    <ResponsiveContainer width="100%" height={130}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min, max]}
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}kg`}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(17,24,39,0.95)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 12,
            fontSize: 13,
            color: "#fff",
          }}
          itemStyle={{ color: "#a78bfa" }}
          formatter={(v) => [`${v} kg`, "Weight"]}
          labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}
        />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          fill="url(#weightGrad)"
          dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#a78bfa", stroke: "none" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Water tracker ────────────────────────────────────────────────────────────
function WaterTracker({ glasses, target }) {
  const pct = Math.min((glasses / target) * 100, 100);
  const drops = Array.from({ length: target }, (_, i) => i < glasses);

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            flex: 1,
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, #06b6d490, #06b6d4)",
              transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#06b6d4", whiteSpace: "nowrap" }}>
          {glasses} / {target}
        </span>
      </div>

      {/* Drop icons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {drops.map((filled, i) => (
          <span
            key={i}
            style={{
              fontSize: 20,
              opacity: filled ? 1 : 0.18,
              filter: filled ? "drop-shadow(0 0 6px rgba(6,182,212,0.6))" : "none",
              transition: "all 0.3s ease",
            }}
          >
            💧
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon, message }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "18px 0 6px",
        color: "rgba(255,255,255,0.3)",
        fontSize: 14,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      {message}
    </div>
  );
}
