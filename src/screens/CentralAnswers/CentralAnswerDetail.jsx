import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import MarkdownRenderer from "../../components/central/MarkdownRenderer";
import { fetchVaultItemById, deleteVaultItem, updateVaultItem, fetchCollections, createCollection, addToCollection } from "../../api/vault";
import { T, VAULT_CSS, relDate } from "../Vault/vaultDesign";

const A = { color: T.purple, dim: T.purpleDim, glow: T.purpleGlow };

function extractContent(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.raw || JSON.stringify(raw, null, 2);
}

// ── Add-to-Collection bottom sheet ───────────────────────────────────────────
function AddToCollectionSheet({ itemId, onClose }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [newName, setNewName]         = useState("");
  const [adding, setAdding]           = useState(null); // collection id being added
  const [toast, setToast]             = useState(null);

  useEffect(() => {
    fetchCollections()
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleAdd = async (colId) => {
    setAdding(colId);
    try {
      await addToCollection(colId, itemId);
      showToast("Added to collection");
      setTimeout(onClose, 1000);
    } catch {
      showToast("Failed — try again");
    } finally {
      setAdding(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const col = await createCollection({ name: newName.trim() });
      await addToCollection(col.id, itemId);
      showToast(`Added to "${col.name}"`);
      setTimeout(onClose, 1000);
    } catch {
      showToast("Failed — try again");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.72)" }}/>
      <div style={{
        position:"relative", borderTopLeftRadius:28, borderTopRightRadius:28,
        background:T.s1, borderTop:`1px solid ${T.border}`,
        maxHeight:"75vh", display:"flex", flexDirection:"column",
        animation:"slideUp .28s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Handle */}
        <div style={{ padding:"14px 0 6px", display:"flex", justifyContent:"center" }}>
          <div style={{ width:40, height:4, background:T.border2, borderRadius:2 }}/>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position:"absolute", top:60, left:"50%", transform:"translateX(-50%)",
            background:T.s2, border:`1px solid ${T.border}`, borderRadius:12,
            padding:"9px 18px", fontSize:13, fontWeight:600, color:T.t1,
            whiteSpace:"nowrap", zIndex:10,
          }}>{toast}</div>
        )}

        <div style={{ padding:"8px 22px 24px", overflowY:"auto" }}>
          <p style={{ fontSize:17, fontWeight:800, color:T.t1, margin:"0 0 18px", letterSpacing:"-0.3px" }}>
            Add to Collection
          </p>

          {/* Create new */}
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <input
              placeholder="New collection name…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              style={{
                flex:1, padding:"11px 14px", background:T.s2,
                border:`1px solid ${T.border}`, borderRadius:12,
                fontSize:14, color:T.t1, fontFamily:"'Inter',sans-serif", outline:"none",
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              style={{
                padding:"11px 18px", borderRadius:12, border:"none", cursor:"pointer",
                background: newName.trim() ? `linear-gradient(135deg,${T.warn},#EA6A0A)` : T.s3,
                color: newName.trim() ? "#000" : T.t3,
                fontSize:14, fontWeight:800, flexShrink:0,
                transition:"all .15s",
              }}
            >{creating ? "…" : "Create"}</button>
          </div>

          {/* Existing collections */}
          {loading ? (
            <p style={{ fontSize:13, color:T.t3, textAlign:"center", padding:"16px 0" }}>Loading…</p>
          ) : collections.length === 0 ? (
            <p style={{ fontSize:13, color:T.t3, textAlign:"center", padding:"8px 0" }}>
              No collections yet — create one above
            </p>
          ) : (
            <>
              <p style={{ fontSize:11, color:T.t3, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase", margin:"0 0 10px" }}>
                Your Collections
              </p>
              {collections.map(col => (
                <div key={col.id} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"12px 14px", background:T.s2, border:`1px solid ${T.border}`,
                  borderRadius:12, marginBottom:8,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:col.color || T.warn, flexShrink:0 }}/>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:T.t1, margin:0 }}>{col.name}</p>
                      <p style={{ fontSize:11, color:T.t3, margin:"1px 0 0" }}>{col.item_count} item{col.item_count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(col.id)}
                    disabled={!!adding}
                    style={{
                      padding:"7px 14px", borderRadius:10, border:"none", cursor:"pointer",
                      background:T.purpleDim, border:`1px solid rgba(168,85,247,.2)`,
                      color:T.purple, fontSize:12, fontWeight:700,
                      opacity: adding === col.id ? 0.6 : 1,
                    }}
                  >{adding === col.id ? "Adding…" : "Add"}</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete confirmation sheet ─────────────────────────────────────────────────
function DeleteSheet({ onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={onCancel} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.72)" }}/>
      <div style={{
        position:"relative", borderTopLeftRadius:28, borderTopRightRadius:28,
        background:T.s1, borderTop:`1px solid ${T.red}44`,
        animation:"slideUp .28s ease",
      }}>
        <div style={{ padding:"14px 0 6px", display:"flex", justifyContent:"center" }}>
          <div style={{ width:40, height:4, background:T.border2, borderRadius:2 }}/>
        </div>
        <div style={{ padding:"8px 22px 36px" }}>
          <p style={{ fontSize:18, fontWeight:800, color:T.t1, margin:"0 0 8px" }}>Delete this answer?</p>
          <p style={{ fontSize:13, color:T.t3, margin:"0 0 24px", lineHeight:1.5 }}>
            This response will be permanently removed from your Vault. This cannot be undone.
          </p>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onCancel} style={{
              flex:1, padding:"14px", borderRadius:14,
              background:T.s2, border:`1px solid ${T.border}`,
              color:T.t2, fontSize:14, fontWeight:700, cursor:"pointer",
            }}>Cancel</button>
            <button onClick={onConfirm} style={{
              flex:1, padding:"14px", borderRadius:14,
              background:T.red, border:"none",
              color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
            }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main detail screen ────────────────────────────────────────────────────────
export default function CentralAnswerDetail() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [answer, setAnswer]           = useState(null);
  const [loading, setLoad]            = useState(true);
  const [showDelete, setShowDelete]   = useState(false);
  const [showCollect, setShowCollect] = useState(false);

  useEffect(() => {
    fetchVaultItemById(id)
      .then(setAnswer)
      .catch(() => {})
      .finally(() => setLoad(false));
  }, [id]);

  const handleDelete = async () => {
    await deleteVaultItem(id);
    navigate("/vault/central");
  };

  const handlePin = async () => {
    await updateVaultItem(id, { is_pinned: !answer.is_pinned });
    setAnswer({ ...answer, is_pinned: !answer.is_pinned });
  };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12, width:"80%", maxWidth:320 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              height:14, borderRadius:6,
              background:`linear-gradient(90deg,${T.s2} 25%,${T.s3} 50%,${T.s2} 75%)`,
              backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite",
              width: i === 1 ? "60%" : i === 4 ? "40%" : "100%",
            }}/>
          ))}
        </div>
        <style>{VAULT_CSS}</style>
      </div>
    );
  }

  if (!answer) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:16, padding:24 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke={T.border2} strokeWidth="2"/>
          <path d="M24 14V26M24 32V34" stroke={T.border2} strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize:16, fontWeight:700, color:T.t1, margin:0 }}>Answer not found</p>
        <button onClick={() => navigate("/vault/central")} style={{
          padding:"12px 24px", borderRadius:12, border:"none", cursor:"pointer",
          background:A.dim, color:A.color, fontSize:14, fontWeight:700,
        }}>Back to Central Answers</button>
        <style>{VAULT_CSS}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, paddingBottom:90, fontFamily:"'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ padding:"56px 22px 0" }}>
        <button onClick={() => navigate(-1)} style={{
          background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:16,
          display:"flex", alignItems:"center", gap:6,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={A.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:13, color:A.color, fontWeight:600 }}>Central Answers</span>
        </button>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <p style={{ fontSize:20, fontWeight:900, color:T.t1, margin:0, flex:1, paddingRight:12, letterSpacing:"-0.4px", lineHeight:1.3 }}>
            {answer.title || "Untitled Answer"}
          </p>
          <button onClick={handlePin} style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <path d="M9 1L13 5L8.5 9.5L7 13L1 7L4.5 5.5L9 1Z"
                fill={answer.is_pinned ? A.color : "none"}
                stroke={answer.is_pinned ? A.color : T.t3} strokeWidth="1.2"/>
            </svg>
          </button>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:A.color }}/>
          <span style={{ fontSize:12, color:T.t3, fontWeight:600 }}>Central AI</span>
          <span style={{ color:T.border2, fontSize:12 }}>·</span>
          <span style={{ fontSize:12, color:T.t3 }}>
            {new Date(answer.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:"0 22px 22px" }}>
        <div style={{
          background:T.s1, border:`1px solid ${T.border}`, borderRadius:T.rad,
          padding:"20px", marginBottom:16,
        }}>
          <div style={{ fontSize:14, lineHeight:1.8, color:T.t2 }}>
            <MarkdownRenderer text={extractContent(answer.content)}/>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {/* Follow-up */}
          <button
            onClick={() => navigate("/central", { state: { followUpContext: { id: answer.id, title: answer.title, content: answer.content } } })}
            style={{
              padding:"13px 8px", borderRadius:14, border:`1px solid ${A.color}30`,
              background:A.dim, color:A.color, fontSize:12, fontWeight:700,
              cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9C2 5.1 5.1 2 9 2C12.9 2 16 5.1 16 9C16 12.9 12.9 16 9 16H2L4.5 13.5" stroke={A.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Follow-up
          </button>

          {/* Add to collection */}
          <button
            onClick={() => setShowCollect(true)}
            style={{
              padding:"13px 8px", borderRadius:14, border:`1px solid rgba(249,115,22,.3)`,
              background:"rgba(249,115,22,.1)", color:T.warn, fontSize:12, fontWeight:700,
              cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="3" stroke={T.warn} strokeWidth="1.4"/>
              <path d="M9 6V12M6 9H12" stroke={T.warn} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Collect
          </button>

          {/* Delete */}
          <button
            onClick={() => setShowDelete(true)}
            style={{
              padding:"13px 8px", borderRadius:14, border:`1px solid ${T.red}30`,
              background:T.redDim, color:T.red, fontSize:12, fontWeight:700,
              cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 5H15M6 5V3H12V5M7 8V14M11 8V14" stroke={T.red} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="4" y="5" width="10" height="11" rx="2" stroke={T.red} strokeWidth="1.4"/>
            </svg>
            Delete
          </button>
        </div>
      </div>

      <BottomNav/>

      {showDelete  && <DeleteSheet onConfirm={handleDelete} onCancel={() => setShowDelete(false)}/>}
      {showCollect && <AddToCollectionSheet itemId={answer.id} onClose={() => setShowCollect(false)}/>}

      <style>{VAULT_CSS}</style>
    </div>
  );
}
