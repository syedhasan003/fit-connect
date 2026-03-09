/**
 * ExerciseDetail
 * ──────────────
 * Full-screen exercise info page reached via /exercises/:id
 *
 * Shows:
 *  • Animated exercise frames (toggles between frame 0 and frame 1 JPGs every 800ms)
 *  • Difficulty / Equipment / Category chips
 *  • Muscle diagram (MuscleSVG)
 *  • Step-by-step instructions
 *  • Tips & Common Mistakes (collapsible)
 *  • Calories / min estimate
 */
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MuscleSVG from "../../components/MuscleSVG";
import { fetchExerciseById, fetchExerciseVideo } from "../../api/exercises";

// ── Design tokens (match app theme) ──────────────────────────────────────────
const C = {
  bg:       "#0d0d0f",
  surface:  "#18181c",
  surface2: "#222228",
  border:   "#2a2a34",
  accent:   "#6366f1",
  green:    "#22c55e",
  orange:   "#f97316",
  amber:    "#fbbf24",
  red:      "#ef4444",
  text:     "#f1f1f3",
  muted:    "#6b7280",
  muted2:   "#9ca3af",
};

const difficultyColor = {
  beginner:     "#22c55e",
  intermediate: "#f59e0b",
  expert:       "#ef4444",
};

function Chip({ label, color = C.muted2 }) {
  return (
    <span style={{
      background: "rgba(255,255,255,0.06)",
      border: `1px solid ${color}44`,
      color,
      borderRadius: 20,
      padding: "3px 10px",
      fontSize: 12,
      fontWeight: 600,
      textTransform: "capitalize",
    }}>
      {label}
    </span>
  );
}

function Section({ title, children, collapsible = false }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => collapsible && setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: collapsible ? "pointer" : "default",
          padding: 0, marginBottom: 10, width: "100%", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</span>
        {collapsible && (
          <span style={{ marginLeft: "auto", color: C.muted, fontSize: 13 }}>
            {open ? "▲" : "▼"}
          </span>
        )}
      </button>
      {(!collapsible || open) && children}
    </div>
  );
}

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // If navigating from WorkoutBuilder passing name, show loading state nicely
  const exerciseNameFromState = location.state?.exerciseName;

  const [exercise,   setExercise]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);   // toggles 0 ↔ 1 for animation
  const [imgError,   setImgError]   = useState(false);
  const [showVideo,   setShowVideo]   = useState(false);
  const [videoId,     setVideoId]     = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const intervalRef = useRef(null);

  // ── Fix legacy /images/ path in GitHub raw URLs ───────────────────────────
  // DB was seeded with .../exercises/NAME/images/0.jpg
  // Correct path is  .../exercises/NAME/0.jpg
  function fixImgUrl(url) {
    if (!url) return url;
    return url.replace(/\/images\/(0|1)\.jpg$/, "/$1.jpg");
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setImgError(false);
    setFrameIndex(0);
    fetchExerciseById(id)
      .then(setExercise)
      .catch(() => setError("Exercise not found."))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Fetch YouTube video ID (cached after first call) ─────────────────────
  useEffect(() => {
    if (!exercise) return;
    // If video_id already came with the exercise data, use it directly
    if (exercise.youtube_video_id) {
      setVideoId(exercise.youtube_video_id);
      return;
    }
    setVideoLoading(true);
    fetchExerciseVideo(exercise.id)
      .then(({ video_id }) => setVideoId(video_id || null))
      .catch(() => setVideoId(null))
      .finally(() => setVideoLoading(false));
  }, [exercise]);

  // ── Toggle between frame 0 and frame 1 every 800ms ───────────────────────
  useEffect(() => {
    if (!exercise) return;
    const imageUrls = parse(exercise.image_urls);
    if (imageUrls.length < 2 || imgError) return;

    intervalRef.current = setInterval(() => {
      setFrameIndex(i => (i === 0 ? 1 : 0));
    }, 800);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, imgError]);

  // ── Parse JSON arrays safely ──────────────────────────────────────────────
  function parse(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try { return JSON.parse(field); } catch { return []; }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: C.muted, fontSize: 14 }}>{exerciseNameFromState || "Loading…"}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !exercise) return (
    <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <span style={{ fontSize: 32 }}>🏋️</span>
      <p style={{ color: C.muted, fontSize: 14 }}>{error || "Exercise not found"}</p>
      <button onClick={() => navigate(-1)} style={{ color: C.accent, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>← Go back</button>
    </div>
  );

  const primaryMuscles   = parse(exercise.primary_muscles);
  const secondaryMuscles = parse(exercise.secondary_muscles);
  const instructions     = parse(exercise.instructions);
  const tips             = parse(exercise.tips);
  const mistakes         = parse(exercise.common_mistakes);
  const imageUrls        = parse(exercise.image_urls).map(fixImgUrl);

  // Active frame src: use image_urls array if available, else fall back to gif_url
  const hasFrames  = imageUrls.length >= 1 && !imgError;
  const activeSrc  = hasFrames
    ? imageUrls[Math.min(frameIndex, imageUrls.length - 1)]
    : fixImgUrl(exercise.gif_url || null);

  const diffColor = difficultyColor[exercise.difficulty?.toLowerCase()] || C.muted2;

  // YouTube search query for this exercise
  const ytQuery   = encodeURIComponent(`${exercise.name} proper form technique`);
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${ytQuery}`;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, paddingBottom: 32 }}>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.bg,
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: C.surface2, border: "none", borderRadius: 10, width: 36, height: 36, color: C.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0, flex: 1 }}>
          {exercise.name}
        </h1>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "16px 16px 0" }}>

        {/* ── Exercise Animation Hero ─────────────────────────────────────── */}
        <div style={{
          borderRadius: 20,
          overflow: "hidden",
          background: C.surface,
          border: `1px solid ${C.border}`,
          marginBottom: 16,
          position: "relative",
        }}>
          {/* Image / placeholder */}
          {activeSrc && !imgError ? (
            <img
              key={activeSrc}
              src={activeSrc}
              alt={exercise.name}
              onError={() => setImgError(true)}
              style={{
                width: "100%",
                maxHeight: 320,
                objectFit: "cover",
                display: "block",
                animation: "frameFade 0.3s ease-in-out",
              }}
            />
          ) : (
            <div style={{
              height: 180, display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 8,
              background: "rgba(255,255,255,0.02)",
            }}>
              <span style={{ fontSize: 44 }}>🏋️</span>
              <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>No image available</p>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
            background: "linear-gradient(to top, rgba(24,24,28,0.95) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />

          {/* Frame badge */}
          {imageUrls.length >= 2 && !imgError && (
            <div style={{
              position: "absolute", top: 12, left: 12,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
              borderRadius: 20, padding: "3px 10px",
              fontSize: 11, fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              {frameIndex === 0 ? "START POSITION" : "END POSITION"}
            </div>
          )}

          {/* Speed control for animation */}
          {imageUrls.length >= 2 && !imgError && (
            <div style={{
              position: "absolute", bottom: 12, left: 12,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
              borderRadius: 20, padding: "3px 10px",
              fontSize: 11, color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              ⟳ animated
            </div>
          )}
        </div>

        <style>{`
          @keyframes frameFade { from { opacity: 0.55; } to { opacity: 1; } }
        `}</style>

        {/* ── Form Video / Guide ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>

          {/* ── Loading state ── */}
          {videoLoading && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{
                width: 18, height: 18, flexShrink: 0,
                border: "2px solid rgba(255,0,0,0.4)", borderTopColor: "#ff0000",
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
              }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Finding best tutorial…</p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Checking our video library</p>
              </div>
            </div>
          )}

          {/* ── Video available: collapsible embed ── */}
          {!videoLoading && videoId && (
            <>
              <button
                onClick={() => setShowVideo(v => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: showVideo ? "rgba(255,0,0,0.08)" : C.surface,
                  border: `1px solid ${showVideo ? "rgba(255,0,0,0.3)" : C.border}`,
                  borderRadius: showVideo ? "14px 14px 0 0" : 14,
                  padding: "12px 16px", cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(255,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14,
                  }}>▶</span>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Watch Proper Form</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
                      {showVideo ? "Tap to hide" : "YouTube tutorial · tap to watch"}
                    </p>
                  </div>
                </div>
                <span style={{
                  color: C.muted, fontSize: 14,
                  transform: showVideo ? "rotate(180deg)" : "none",
                  transition: "transform 0.25s",
                }}>▾</span>
              </button>
              {showVideo && (
                <div style={{
                  border: "1px solid rgba(255,0,0,0.3)", borderTop: "none",
                  borderRadius: "0 0 14px 14px", overflow: "hidden",
                  background: "#000", position: "relative", paddingTop: "56.25%",
                }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`}
                    title={`${exercise.name} proper form`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              )}
            </>
          )}

          {/* ── No cached video: direct YouTube search for this exercise ── */}
          {!videoLoading && !videoId && (
            <a
              href={ytSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "rgba(255,0,0,0.07)",
                border: "1px solid rgba(255,0,0,0.22)",
                borderRadius: 14, padding: "14px 16px",
                textDecoration: "none",
              }}
            >
              {/* YouTube logo pill */}
              <span style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "#ff0000",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: "#fff", fontWeight: 700,
              }}>▶</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: C.text }}>
                  Watch {exercise.name} on YouTube
                </p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
                  Proper form · technique tutorial · opens in browser
                </p>
              </div>

              <span style={{ color: C.muted, fontSize: 16, flexShrink: 0 }}>↗</span>
            </a>
          )}
        </div>

        {/* ── Chips ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {exercise.difficulty && <Chip label={exercise.difficulty} color={diffColor} />}
          {exercise.category   && <Chip label={exercise.category} color={C.accent} />}
          {exercise.equipment  && <Chip label={exercise.equipment} color={C.muted2} />}
          {exercise.force      && <Chip label={exercise.force} color={C.muted2} />}
          {exercise.mechanic   && <Chip label={exercise.mechanic} color={C.muted2} />}
          {exercise.calories_per_min && (
            <Chip label={`~${exercise.calories_per_min} kcal/min`} color={C.orange} />
          )}
        </div>

        {/* ── Muscles ────────────────────────────────────────────────────── */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Muscles Worked</p>
          {primaryMuscles.length > 0 && (
            <p style={{ fontSize: 12, color: C.orange, margin: "0 0 2px" }}>
              Primary: {primaryMuscles.join(", ")}
            </p>
          )}
          {secondaryMuscles.length > 0 && (
            <p style={{ fontSize: 12, color: C.amber, margin: "0 0 12px" }}>
              Secondary: {secondaryMuscles.join(", ")}
            </p>
          )}
          <MuscleSVG
            primaryMuscles={primaryMuscles}
            secondaryMuscles={secondaryMuscles}
            size={130}
          />
        </div>

        {/* ── Instructions ───────────────────────────────────────────────── */}
        {instructions.length > 0 && (
          <div id="form-guide-section">
          <Section title="How to Perform">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {instructions.map((step, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "10px 12px",
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: `rgba(99,102,241,0.15)`, border: `1px solid rgba(99,102,241,0.3)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: C.accent,
                  }}>{i + 1}</span>
                  <p style={{ margin: 0, fontSize: 13, color: C.muted2, lineHeight: 1.6 }}>{step}</p>
                </div>
              ))}
            </div>
          </Section>
          </div>
        )}

        {/* ── Tips ───────────────────────────────────────────────────────── */}
        {tips.length > 0 && (
          <Section title="Pro Tips" collapsible>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${C.accent}`,
                  borderRadius: "0 10px 10px 0",
                  padding: "10px 12px",
                  fontSize: 13, color: C.muted2, lineHeight: 1.5,
                }}>
                  {tip}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Common Mistakes ────────────────────────────────────────────── */}
        {mistakes.length > 0 && (
          <Section title="Common Mistakes" collapsible>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mistakes.map((m, i) => (
                <div key={i} style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${C.red}`,
                  borderRadius: "0 10px 10px 0",
                  padding: "10px 12px",
                  fontSize: 13, color: C.muted2, lineHeight: 1.5,
                }}>
                  {m}
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}
