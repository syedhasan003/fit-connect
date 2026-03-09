/**
 * ExerciseLibrary
 * ───────────────
 * Searchable + filterable library of all seeded exercises.
 * Tapping a card navigates to /exercises/:id (ExerciseDetail).
 *
 * Accessible from:
 *  • Discovery screen's "Exercises" card
 *  • WorkoutBuilder's "ℹ" button (navigates with exerciseName pre-searched)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchExercises, fetchExerciseFilters } from "../../api/exercises";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:       "#0d0d0f",
  surface:  "#18181c",
  surface2: "#222228",
  border:   "#2a2a34",
  accent:   "#6366f1",
  orange:   "#f97316",
  amber:    "#fbbf24",
  green:    "#22c55e",
  text:     "#f1f1f3",
  muted:    "#6b7280",
  muted2:   "#9ca3af",
};

const DIFF_COLOR = {
  beginner:     "#22c55e",
  intermediate: "#f59e0b",
  expert:       "#ef4444",
};

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.accent : C.surface2,
        color: active ? "#fff" : C.muted2,
        border: `1px solid ${active ? C.accent : C.border}`,
        borderRadius: 20,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
        textTransform: "capitalize",
      }}
    >
      {label}
    </button>
  );
}

function ExerciseCard({ exercise, onInfoClick }) {
  const parse = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try { return JSON.parse(field); } catch { return []; }
  };

  const primary = parse(exercise.primary_muscles);
  const diff    = exercise.difficulty?.toLowerCase();
  const diffColor = DIFF_COLOR[diff] || C.muted;

  return (
    <div
      onClick={() => onInfoClick(exercise)}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 14,
        display: "flex",
        gap: 12,
        cursor: "pointer",
        transition: "border-color 0.15s",
        position: "relative",
      }}
    >
      {/* GIF thumbnail */}
      <div style={{
        width: 64, height: 64, borderRadius: 10,
        background: C.surface2, flexShrink: 0,
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {exercise.gif_url ? (
          <img
            src={exercise.gif_url}
            alt={exercise.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
        ) : null}
        <span style={{ fontSize: 24, display: exercise.gif_url ? "none" : "flex" }}>🏋️</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: "0 0 4px", lineHeight: 1.3 }}>
          {exercise.name}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
          {exercise.difficulty && (
            <span style={{ fontSize: 11, color: diffColor, fontWeight: 600, textTransform: "capitalize" }}>
              {exercise.difficulty}
            </span>
          )}
          {exercise.equipment && (
            <span style={{ fontSize: 11, color: C.muted }}>• {exercise.equipment}</span>
          )}
        </div>
        {primary.length > 0 && (
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
            {primary.slice(0, 3).join(" · ")}
            {primary.length > 3 ? ` +${primary.length - 3}` : ""}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div style={{ display: "flex", alignItems: "center", color: C.muted, fontSize: 16 }}>›</div>
    </div>
  );
}

// ── Not-in-library empty state ────────────────────────────────────────────────
function NotInLibrary({ search, hasFilters, onClearFilters }) {
  if (!search && hasFilters) {
    return (
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 12 }}>No exercises match these filters</p>
        <button onClick={onClearFilters} style={{ color: C.accent, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
          Clear filters
        </button>
      </div>
    );
  }

  if (!search) {
    return (
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>🏋️</p>
        <p style={{ color: C.muted, fontSize: 14 }}>No exercises found</p>
      </div>
    );
  }

  // If the search looks like a real exercise name (4+ chars), offer YouTube.
  // Shorter/gibberish inputs (e.g. "huh") get nothing.
  const looksLikeExercise = search.trim().length >= 4;
  const ytQuery = encodeURIComponent(`${search.trim()} proper form`);
  const ytUrl   = `https://www.youtube.com/results?search_query=${ytQuery}`;

  return (
    <div style={{ textAlign: "center", paddingTop: 60 }}>
      <p style={{ fontSize: 36, margin: "0 0 12px" }}>🔍</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
        No results for "{search}"
      </p>

      {looksLikeExercise ? (
        <>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 auto 20px", maxWidth: 260, lineHeight: 1.6 }}>
            Not in our library yet — watch it on YouTube instead.
          </p>
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#ff0000",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              marginBottom: hasFilters ? 16 : 0,
            }}
          >
            ▶ Watch "{search}" on YouTube
          </a>
        </>
      ) : (
        <p style={{ fontSize: 13, color: C.muted, margin: "0 auto 20px", maxWidth: 260, lineHeight: 1.6 }}>
          Try searching by movement name, e.g.{" "}
          <span style={{ color: C.accent }}>"fly"</span>,{" "}
          <span style={{ color: C.accent }}>"romanian deadlift"</span>, or{" "}
          <span style={{ color: C.accent }}>"incline press"</span>.
        </p>
      )}

      {hasFilters && (
        <button onClick={onClearFilters} style={{ display: "block", margin: "8px auto 0", color: C.accent, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function ExerciseLibrary() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill search if coming from WorkoutBuilder with a name
  const prefill = location.state?.search || "";

  const [search,     setSearch]     = useState(prefill);
  const [muscle,     setMuscle]     = useState("");
  const [equipment,  setEquipment]  = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category,   setCategory]   = useState("");

  const [exercises, setExercises] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [hasMore,   setHasMore]   = useState(false);
  const [offset,    setOffset]    = useState(0);
  const LIMIT = 20;

  const [filters, setFilters] = useState({ muscles: [], equipments: [], difficulties: [], categories: [] });

  const searchTimeout = useRef(null);

  // Fetch filter metadata once
  useEffect(() => {
    fetchExerciseFilters()
      .then(setFilters)
      .catch(() => {});
  }, []);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const off = reset ? 0 : offset;
      const data = await fetchExercises({ search, muscle, equipment, difficulty, category, limit: LIMIT, offset: off });
      const items = data.exercises || data || [];
      if (reset) {
        setExercises(items);
        setOffset(items.length);
      } else {
        setExercises(prev => [...prev, ...items]);
        setOffset(prev => prev + items.length);
      }
      setHasMore(items.length === LIMIT);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, muscle, equipment, difficulty, category, offset]);

  // Reload when filters change
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setOffset(0);
      load(true);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, muscle, equipment, difficulty, category]);

  const handleInfo = (ex) => {
    navigate(`/exercises/${ex.id}`, { state: { exerciseName: ex.name } });
  };

  const clearFilters = () => {
    setMuscle(""); setEquipment(""); setDifficulty(""); setCategory("");
  };

  const hasActiveFilters = muscle || equipment || difficulty || category;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, paddingBottom: 80 }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        padding: "14px 16px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: C.surface2, border: "none", borderRadius: 10, width: 36, height: 36, color: C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ←
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
            Exercise Library
          </h1>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: C.muted }}>🔍</span>
          <input
            type="text"
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "10px 12px 10px 38px",
              fontSize: 14, color: C.text, outline: "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Filter chips row */}
        <div style={{ overflowX: "auto", display: "flex", gap: 8, paddingBottom: 12, scrollbarWidth: "none" }}>
          {/* Difficulty */}
          {["beginner", "intermediate", "expert"].map(d => (
            <FilterChip key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(difficulty === d ? "" : d)} />
          ))}

          {/* Muscles */}
          {(filters.muscles || []).slice(0, 8).map(m => (
            <FilterChip key={m} label={m} active={muscle === m} onClick={() => setMuscle(muscle === m ? "" : m)} />
          ))}

          {/* Equipment */}
          {(filters.equipments || []).slice(0, 6).map(e => (
            <FilterChip key={e} label={e} active={equipment === e} onClick={() => setEquipment(equipment === e ? "" : e)} />
          ))}

          {hasActiveFilters && (
            <FilterChip label="✕ Clear" active={false} onClick={clearFilters} />
          )}
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 16px 0" }}>
        {/* Count */}
        {!loading && (
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
            {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
            {hasMore ? "+" : ""}
          </p>
        )}

        {loading && exercises.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: C.muted, fontSize: 13 }}>Loading exercises…</p>
          </div>
        ) : exercises.length === 0 ? (
          <NotInLibrary search={search} hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {exercises.map(ex => (
              <ExerciseCard key={ex.id} exercise={ex} onInfoClick={handleInfo} />
            ))}

            {hasMore && (
              <button
                onClick={() => load(false)}
                disabled={loading}
                style={{
                  background: C.surface2, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "12px", color: C.muted2,
                  fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                  marginTop: 4,
                }}
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
