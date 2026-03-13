import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import {
  fetchVaultItemById, deleteVaultItem, updateVaultItem,
  fetchCollections, createCollection, addToCollection,
} from "../../api/vault";
import { setActiveWorkoutProgram } from "../../api/user";
import { T, VAULT_CSS, relDate } from "../Vault/vaultDesign";

const A = { color: T.lime, dim: T.limeDim, glow: T.limeGlow };
const C = { color: T.warn, dim: "rgba(249,115,22,0.12)" };        // collection orange

// ── Skeleton shimmer ──────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg,${T.s2} 25%,${T.s3} 50%,${T.s2} 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style,
    }}/>
  );
}

// ── Add-to-Collection sheet ───────────────────────────────────────────────────
function CollectSheet({ itemId, onClose }) {
  const [cols, setCols]       = useState([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [toast, setToast]     = useState("");

  useEffect(() => { fetchCollections().then(setCols).catch(() => {}); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => { setToast(""); onClose(); }, 1400);
  };

  const handleCreate = async () => {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const col = await createCollection({ name: newName.trim(), color: C.color });
      await addToCollection(col.id, itemId);
      showToast("Added to new collection");
    } catch { showToast("Something went wrong"); }
    finally { setCreating(false); }
  };

  const handleAdd = async (colId) => {
    try {
      await addToCollection(colId, itemId);
      showToast("Added to collection");
    } catch { showToast("Something went wrong"); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:100 }}/>
      <div style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:T.s2, borderTop:`1px solid ${T.border}`,
        borderTopLeftRadius:20, borderTopRightRadius:20,
        padding:"20px 20px 44px", zIndex:101,
        animation:"slideUp .25s ease-out", fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{ width:36, height:4, background:T.border2, borderRadius:2, margin:"0 auto 20px" }}/>

        <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 16px" }}>Add to Collection</p>

        {/* Create new */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <input
            placeholder="New collection name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            style={{
              flex:1, padding:"10px 14px", background:T.bg,
              border:`1px solid ${T.border}`, borderRadius:10,
              fontSize:14, color:T.t1, fontFamily:"'Inter',sans-serif", outline:"none",
            }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            style={{
              padding:"10px 18px", borderRadius:10, border:"none",
              background:C.color, color:"#000",
              fontSize:13, fontWeight:700, cursor:"pointer",
              opacity: (creating || !newName.trim()) ? .45 : 1,
              fontFamily:"'Inter',sans-serif",
            }}
          >Create</button>
        </div>

        {/* Existing collections */}
        {cols.length > 0 && (
          <>
            <p style={{ fontSize:11, color:T.t3, margin:"0 0 10px", fontWeight:700, letterSpacing:"0.5px" }}>
              EXISTING COLLECTIONS
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:180, overflowY:"auto" }}>
              {cols.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleAdd(c.id)}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"12px 14px", background:T.bg,
                    border:`1px solid ${T.border}`, borderRadius:10,
                    cursor:"pointer", color:T.t1,
                    fontFamily:"'Inter',sans-serif", fontSize:14, textAlign:"left",
                  }}
                >
                  <span style={{ fontWeight:700 }}>{c.name}</span>
                  <span style={{ fontSize:11, color:T.t3 }}>{c.item_count} item{c.item_count !== 1 ? "s" : ""}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {toast && (
          <div style={{
            position:"absolute", bottom:50, left:"50%", transform:"translateX(-50%)",
            background:A.color, color:"#000", borderRadius:8,
            padding:"8px 18px", fontSize:13, fontWeight:700, whiteSpace:"nowrap",
          }}>{toast}</div>
        )}
      </div>
    </>
  );
}

// ── Delete confirmation sheet ─────────────────────────────────────────────────
function DeleteSheet({ onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:100 }}/>
      <div style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:T.s2, borderTop:`1px solid rgba(239,68,68,.3)`,
        borderTopLeftRadius:20, borderTopRightRadius:20,
        padding:"20px 20px 44px", zIndex:101,
        animation:"slideUp .25s ease-out", fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{ width:36, height:4, background:T.border2, borderRadius:2, margin:"0 auto 20px" }}/>
        <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 8px" }}>Delete Workout?</p>
        <p style={{ fontSize:13, color:T.t3, margin:"0 0 22px" }}>
          This cannot be undone. The workout will be permanently deleted.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:"13px", borderRadius:12,
            border:`1px solid ${T.border}`, background:"none",
            color:T.t1, fontSize:14, fontWeight:700, cursor:"pointer",
            fontFamily:"'Inter',sans-serif",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:"13px", borderRadius:12,
            border:"none", background:T.red,
            color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
            fontFamily:"'Inter',sans-serif",
          }}>Delete</button>
        </div>
      </div>
    </>
  );
}

// ── Exercise card ─────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, index }) {
  return (
    <div style={{
      background:T.s2, border:`1px solid ${T.border}`,
      borderRadius:14, padding:16, marginBottom:10,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
        <div style={{
          width:30, height:30, borderRadius:9,
          background:A.dim, border:"1px solid rgba(122,222,0,.2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, fontWeight:800, color:A.color, flexShrink:0,
        }}>{index + 1}</div>
        <div>
          <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 2px" }}>{exercise.name}</p>
          <p style={{ fontSize:11, color:T.t3, margin:0 }}>
            {exercise.dayName} · {exercise.muscleName} · {exercise.areaName}
          </p>
        </div>
      </div>

      {exercise.sets && exercise.sets.length > 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <div style={{
            padding:"4px 9px", borderRadius:6,
            background:A.dim, border:"1px solid rgba(122,222,0,.2)",
            fontSize:10, fontWeight:700, color:A.color,
          }}>{exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}</div>

          {exercise.sets.map((set, idx) => {
            const parts = [
              set.reps   && `${set.reps} reps`,
              set.weight && `${set.weight} kg`,
              set.rir    && `RIR ${set.rir}`,
            ].filter(Boolean);
            if (!parts.length) return null;
            return (
              <div key={idx} style={{
                padding:"4px 9px", borderRadius:6,
                background:T.s3, border:`1px solid ${T.border2}`,
                fontSize:10, fontWeight:700, color:T.t3,
              }}>{parts.join(" · ")}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ label, sub, color, onClick, disabled = false, icon }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        display:"flex", alignItems:"center", gap:14, textAlign:"left", width:"100%",
        padding:"14px 16px", borderRadius:14,
        background: hover ? `${color}18` : T.s2,
        border:`1px solid ${hover ? color + "50" : T.border}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? .55 : 1,
        transition:"border-color .15s, background .15s",
        fontFamily:"'Inter',sans-serif",
      }}
    >
      <div style={{
        width:34, height:34, borderRadius:10,
        background:`${color}18`, border:`1px solid ${color}30`,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
      }}>{icon}</div>
      <div>
        <p style={{ fontSize:14, fontWeight:700, color: disabled ? T.t3 : color, margin:"0 0 2px" }}>{label}</p>
        {sub && <p style={{ fontSize:11, color:T.t3, margin:0 }}>{sub}</p>}
      </div>
    </button>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ minHeight:"100vh", background:T.bg, paddingBottom:90, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ padding:"56px 22px 0" }}>
        <Skel w={80} h={13} r={6} style={{ marginBottom:24 }}/>
        <Skel w="70%" h={24} r={7} style={{ marginBottom:8 }}/>
        <Skel w="35%" h={11} r={5} style={{ marginBottom:22 }}/>
        <div style={{ display:"flex", gap:8, marginBottom:22 }}>
          <Skel w={70} h={24} r={6}/><Skel w={100} h={24} r={6}/><Skel w={70} h={24} r={6}/>
        </div>
        {[1,2,3,4].map(i => <Skel key={i} w="100%" h={56} r={14} style={{ marginBottom:10 }}/>)}
        <Skel w="40%" h={16} r={6} style={{ marginBottom:14, marginTop:8 }}/>
        {[1,2,3].map(i => <Skel key={i} w="100%" h={88} r={14} style={{ marginBottom:10 }}/>)}
      </div>
      <style>{VAULT_CSS}</style>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight:"100vh", background:T.bg,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:16, color:T.t1, padding:20, fontFamily:"'Inter',sans-serif",
    }}>
      <p style={{ fontSize:17, fontWeight:800, margin:0 }}>Workout Not Found</p>
      <button onClick={() => navigate("/vault/workouts")} style={{
        padding:"11px 22px", borderRadius:12, border:"none",
        background:A.color, color:"#000", fontSize:14, fontWeight:700, cursor:"pointer",
      }}>Back to Workouts</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ManualWorkoutDetail() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [workout, setWorkout]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showDelete, setShowDelete]   = useState(false);
  const [showCollect, setShowCollect] = useState(false);
  const [settingActive, setSettingActive] = useState(false);

  useEffect(() => { loadWorkout(); }, [id]);

  const loadWorkout = async () => {
    try {
      const data = await fetchVaultItemById(id);
      setWorkout(data);
    } catch (e) {
      console.error("Failed to load workout:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVaultItem(id);
      navigate("/vault/workouts");
    } catch (e) {
      console.error("Failed to delete workout:", e);
    }
  };

  const handleTogglePin = async () => {
    try {
      await updateVaultItem(id, { pinned: !workout.pinned });
      setWorkout(prev => ({ ...prev, pinned: !prev.pinned }));
    } catch (e) {
      console.error("Failed to toggle pin:", e);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!workout) return <ErrorState />;

  // ── Parse workout data ──────────────────────────────────────────────────────
  const workoutData = typeof workout.content === "string"
    ? JSON.parse(workout.content)
    : workout.content;

  const isActiveProgram = workoutData?.isActive === true;
  const days = workoutData?.days || [];

  // Flatten exercises with context
  const allExercises = [];
  days.forEach((day, dayIndex) => {
    const isGeneric = !day.name || /^day\s*\d+$/i.test(day.name.trim());
    const dayName = isGeneric ? `Day ${dayIndex + 1}` : day.name;
    (day.muscles || []).forEach(muscle =>
      (muscle.areas || []).forEach(area =>
        (area.exercises || []).forEach(exercise => {
          allExercises.push({ ...exercise, dayNumber: dayIndex + 1, dayName, muscleName: muscle.name, areaName: area.name });
        })
      )
    );
  });

  let totalSets = 0;
  allExercises.forEach(ex => { totalSets += (ex.sets || []).length; });

  // ── Handlers (defined after guards so workoutData is in scope) ──────────────
  const handleEditWorkout = () => {
    navigate("/workout-builder", { state: { workoutData, workoutId: workout.id, mode: "edit" } });
  };

  const handleStartWorkout = () => {
    navigate("/workout-tracking", { state: { vaultId: id } });
  };

  const handleSetAsActive = async () => {
    if (!days.length || settingActive) return;
    setSettingActive(true);
    try {
      await setActiveWorkoutProgram(workout.id);
      await loadWorkout();
    } catch (e) {
      console.error("Failed to set as active:", e);
    } finally {
      setSettingActive(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, paddingBottom:90, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ padding:"56px 22px 0" }}>

        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{
          background:"none", border:"none", cursor:"pointer", padding:0,
          marginBottom:16, display:"flex", alignItems:"center", gap:6,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={A.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:13, color:A.color, fontWeight:600 }}>Workout Plans</span>
        </button>

        {/* Title row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div style={{ flex:1, paddingRight:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
              <p style={{ fontSize:22, fontWeight:900, color:T.t1, margin:0, letterSpacing:"-0.5px" }}>
                {workout.title || "Untitled Workout"}
              </p>
              {isActiveProgram && (
                <span style={{
                  padding:"3px 9px", borderRadius:999,
                  background:A.dim, border:"1px solid rgba(122,222,0,.25)",
                  fontSize:10, fontWeight:800, color:A.color, letterSpacing:"0.4px",
                }}>ACTIVE</span>
              )}
              {workout.pinned && (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M9 1L13 5L8.5 9.5L7 13L1 7L4.5 5.5L9 1Z" fill={A.color} stroke={A.color} strokeWidth="1"/>
                </svg>
              )}
            </div>
            <p style={{ fontSize:12, color:T.t3, margin:0 }}>{relDate(workout.created_at)}</p>
          </div>

          {/* Pin + Delete icon buttons */}
          <div style={{ display:"flex", gap:6 }}>
            <button
              onClick={handleTogglePin}
              style={{
                width:36, height:36, borderRadius:10,
                background: workout.pinned ? A.dim : T.s2,
                border:`1px solid ${workout.pinned ? "rgba(122,222,0,.25)" : T.border}`,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 1L13 5L8.5 9.5L7 13L1 7L4.5 5.5L9 1Z"
                  fill={workout.pinned ? A.color : "none"}
                  stroke={workout.pinned ? A.color : T.t3}
                  strokeWidth="1.3"/>
              </svg>
            </button>
            <button
              onClick={() => setShowDelete(true)}
              style={{
                width:36, height:36, borderRadius:10,
                background:T.s2, border:`1px solid ${T.border}`,
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5H12M5 3.5V2H9V3.5M5.5 6V10.5M8.5 6V10.5M3 3.5L3.5 12H10.5L11 3.5"
                  stroke={T.red} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats badges */}
        <div style={{ display:"flex", gap:8, marginBottom:22, flexWrap:"wrap" }}>
          {[
            { label:`${days.length} day${days.length !== 1 ? "s" : ""}`,       primary:true },
            { label:`${allExercises.length} exercise${allExercises.length !== 1 ? "s" : ""}` },
            { label:`${totalSets} set${totalSets !== 1 ? "s" : ""}` },
          ].map((s, i) => (
            <div key={i} style={{
              padding:"4px 10px", borderRadius:6,
              background: i === 0 ? A.dim : T.s2,
              border:`1px solid ${i === 0 ? "rgba(122,222,0,.2)" : T.border}`,
              fontSize:11, fontWeight:700,
              color: i === 0 ? A.color : T.t2,
            }}>{s.label}</div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:26 }}>

          {/* Edit */}
          <ActionBtn
            label="Edit Workout"
            sub="Modify exercises and structure"
            color={T.purple}
            onClick={handleEditWorkout}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11 2L14 5L5 14H2V11L11 2Z" stroke={T.purple} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
          />

          {/* Start */}
          <ActionBtn
            label="Start Workout"
            sub="Begin today's training session"
            color={T.blue}
            onClick={handleStartWorkout}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M5 3L13 8L5 13V3Z" fill={T.blue} stroke={T.blue} strokeWidth="1" strokeLinejoin="round"/>
              </svg>
            }
          />

          {/* Set as Active */}
          <ActionBtn
            label={isActiveProgram ? "Active Program" : (settingActive ? "Setting…" : "Set as Active Program")}
            sub={isActiveProgram ? "This is your current routine" : "Make this your current routine"}
            color={isActiveProgram ? A.color : T.t3}
            onClick={handleSetAsActive}
            disabled={isActiveProgram || settingActive}
            icon={
              isActiveProgram ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 5" stroke={A.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L9.8 5.8L15 6.3L11.2 9.7L12.5 15L8 12.2L3.5 15L4.8 9.7L1 6.3L6.2 5.8L8 1Z"
                    stroke={T.t3} strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
              )
            }
          />

          {/* Add to Collection */}
          <ActionBtn
            label="Add to Collection"
            sub="Save to a custom collection"
            color={C.color}
            onClick={() => setShowCollect(true)}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4H10M2 8H7M2 12H5" stroke={C.color} strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="13" cy="11" r="3.5" stroke={C.color} strokeWidth="1.3"/>
                <path d="M13 9.5V12.5M11.5 11H14.5" stroke={C.color} strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            }
          />
        </div>

        {/* Exercises section */}
        <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 14px" }}>
          Exercises{" "}
          <span style={{ fontSize:13, color:T.t3, fontWeight:600 }}>({allExercises.length})</span>
        </p>

        {allExercises.length === 0 ? (
          <div style={{
            padding:"40px 20px", textAlign:"center",
            background:T.s2, border:`1px dashed rgba(122,222,0,.2)`,
            borderRadius:T.rad,
          }}>
            <p style={{ fontSize:14, color:T.t3, margin:0 }}>
              No exercises yet. Edit this workout to add some.
            </p>
          </div>
        ) : (
          allExercises.map((ex, i) => (
            <ExerciseCard key={i} exercise={ex} index={i}/>
          ))
        )}
      </div>

      <BottomNav/>
      <style>{VAULT_CSS}</style>

      {showDelete  && <DeleteSheet  onConfirm={handleDelete}          onCancel={() => setShowDelete(false)}/>}
      {showCollect && <CollectSheet itemId={parseInt(id)}             onClose={() => setShowCollect(false)}/>}
    </div>
  );
}
