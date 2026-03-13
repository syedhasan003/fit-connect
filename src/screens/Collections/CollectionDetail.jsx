import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchCollection, deleteCollection, removeFromCollection } from "../../api/vault";
import { T, VAULT_CSS, relDate } from "../Vault/vaultDesign";

const A = { color: T.warn, dim: "rgba(249,115,22,0.12)", glow: "rgba(249,115,22,0.24)" };

function Skel({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg,${T.s2} 25%,${T.s3} 50%,${T.s2} 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style,
    }}/>
  );
}

// ── Type config for items inside collection ───────────────────────────────────
function getItemAccent(item) {
  if (item.source === "central")                           return { color:T.purple, label:"Central AI" };
  if (item.type === "workout" || item.source === "workout") return { color:T.lime,   label:"Workout"    };
  if (item.type === "diet"    || item.source === "diet")    return { color:T.diet,   label:"Diet"       };
  return { color:T.t3, label:"Item" };
}

function getItemRoute(item) {
  if (item.source === "central")                           return `/vault/central/${item.id}`;
  if (item.type === "workout" || item.source === "workout") return `/vault/workouts/${item.id}`;
  if (item.type === "diet"    || item.source === "diet")    return `/vault/diets`;
  return null;
}

// ── Delete collection sheet ───────────────────────────────────────────────────
function DeleteCollectionSheet({ name, onConfirm, onCancel }) {
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
        <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 6px" }}>Delete Collection?</p>
        <p style={{ fontSize:13, color:T.t3, margin:"0 0 22px" }}>
          "{name}" will be deleted. Items won't be removed from the vault.
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

// ── Collection item row ───────────────────────────────────────────────────────
function ItemRow({ item, colId, onNavigate, onRemoved }) {
  const [removing, setRemoving] = useState(false);
  const accent = getItemAccent(item);
  const route  = getItemRoute(item);

  const handleRemove = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    try {
      await removeFromCollection(colId, item.id);
      onRemoved(item.id);
    } catch (err) {
      console.error("Failed to remove:", err);
      setRemoving(false);
    }
  };

  return (
    <div
      onClick={() => route && onNavigate(route)}
      style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"14px 16px", marginBottom:8,
        background:T.s2, border:`1px solid ${T.border}`,
        borderRadius:14, cursor: route ? "pointer" : "default",
        transition:"border-color .15s",
      }}
      onMouseEnter={e => { if (route) e.currentTarget.style.borderColor = accent.color + "44"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
    >
      {/* Type indicator */}
      <div style={{
        width:32, height:32, borderRadius:9, flexShrink:0,
        background:`${accent.color}18`, border:`1px solid ${accent.color}28`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:accent.color }}/>
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{
          fontSize:14, fontWeight:800, color:T.t1, margin:"0 0 3px",
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{item.title || "Untitled"}</p>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{
            padding:"2px 7px", borderRadius:5,
            background:`${accent.color}18`, border:`1px solid ${accent.color}28`,
            fontSize:9, fontWeight:800, color:accent.color, letterSpacing:"0.4px",
          }}>{accent.label.toUpperCase()}</span>
          <span style={{ fontSize:10, color:T.t3 }}>{relDate(item.created_at)}</span>
        </div>
        {item.summary && (
          <p style={{
            fontSize:12, color:T.t3, margin:"5px 0 0",
            overflow:"hidden", display:"-webkit-box",
            WebkitLineClamp:1, WebkitBoxOrient:"vertical",
          }}>{item.summary}</p>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        disabled={removing}
        style={{
          width:28, height:28, borderRadius:8, border:`1px solid ${T.border}`,
          background:T.s3, cursor: removing ? "default" : "pointer",
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          opacity: removing ? .5 : 1,
        }}
      >
        {removing ? (
          <span style={{ fontSize:9, color:T.t3 }}>…</span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke={T.t3} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CollectionDetail() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [col, setCol]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const data = await fetchCollection(id);
      setCol(data);
    } catch (e) {
      console.error("Failed to load collection:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (itemId) => {
    setCol(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== itemId),
      item_count: prev.item_count - 1,
    }));
  };

  const handleDeleteCollection = async () => {
    setDeleting(true);
    try {
      await deleteCollection(id);
      navigate("/vault/collections");
    } catch (e) {
      console.error("Failed to delete collection:", e);
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:T.bg, paddingBottom:90, fontFamily:"'Inter',sans-serif" }}>
        <div style={{ padding:"56px 22px 0" }}>
          <Skel w={80} h={13} r={6} style={{ marginBottom:24 }}/>
          <Skel w="60%" h={22} r={7} style={{ marginBottom:8 }}/>
          <Skel w="35%" h={11} r={5} style={{ marginBottom:22 }}/>
          {[1,2,3].map(i => <Skel key={i} w="100%" h={72} r={14} style={{ marginBottom:8 }}/>)}
        </div>
        <style>{VAULT_CSS}</style>
      </div>
    );
  }

  if (!col) {
    return (
      <div style={{
        minHeight:"100vh", background:T.bg,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        gap:16, color:T.t1, fontFamily:"'Inter',sans-serif",
      }}>
        <p style={{ fontSize:17, fontWeight:800 }}>Collection Not Found</p>
        <button onClick={() => navigate("/vault/collections")} style={{
          padding:"11px 22px", borderRadius:12, border:"none",
          background:A.color, color:"#000", fontSize:14, fontWeight:700, cursor:"pointer",
        }}>Back to Collections</button>
      </div>
    );
  }

  const items = col.items || [];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, paddingBottom:90, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ padding:"56px 22px 0" }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          background:"none", border:"none", cursor:"pointer", padding:0,
          marginBottom:16, display:"flex", alignItems:"center", gap:6,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={A.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:13, color:A.color, fontWeight:600 }}>Collections</span>
        </button>

        {/* Header row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
          <div style={{ flex:1, paddingRight:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              {/* Color orb */}
              <div style={{
                width:36, height:36, borderRadius:11,
                background:`${col.color}20`, border:`1px solid ${col.color}30`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                <div style={{ width:14, height:14, borderRadius:"50%", background:col.color }}/>
              </div>
              <p style={{ fontSize:22, fontWeight:900, color:T.t1, margin:0, letterSpacing:"-0.5px" }}>
                {col.name}
              </p>
            </div>
            {col.description && (
              <p style={{ fontSize:12, color:T.t3, margin:"0 0 4px" }}>{col.description}</p>
            )}
            <p style={{ fontSize:12, color:T.t3, margin:0 }}>
              {items.length} item{items.length !== 1 ? "s" : ""} · {relDate(col.created_at)}
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={() => setShowDelete(true)}
            disabled={deleting}
            style={{
              width:36, height:36, borderRadius:10,
              background:T.s2, border:`1px solid ${T.border}`,
              cursor: deleting ? "default" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 3.5H12M5 3.5V2H9V3.5M5.5 6V10.5M8.5 6V10.5M3 3.5L3.5 12H10.5L11 3.5"
                stroke={T.red} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px" }}>
            <div style={{
              width:56, height:56, borderRadius:16, background:T.s2,
              border:`1px solid ${T.border}`, display:"flex", alignItems:"center",
              justifyContent:"center", margin:"0 auto 16px",
            }}>
              <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="2" stroke={T.border2} strokeWidth="1.6"/>
                <rect x="12" y="3" width="7" height="7" rx="2" stroke={T.border2} strokeWidth="1.6"/>
                <rect x="3" y="12" width="7" height="7" rx="2" stroke={T.border2} strokeWidth="1.6"/>
                <rect x="12" y="12" width="7" height="7" rx="2" stroke={T.border2} strokeWidth="1.6"/>
              </svg>
            </div>
            <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 8px" }}>Empty collection</p>
            <p style={{ fontSize:13, color:T.t3, margin:0 }}>
              Add items to this collection using the "Add to Collection" button on any workout, answer, or meal plan.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize:11, color:T.t3, fontWeight:700, letterSpacing:"0.5px", margin:"0 0 12px" }}>
              {items.length} ITEM{items.length !== 1 ? "S" : ""}
            </p>
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                colId={parseInt(id)}
                onNavigate={navigate}
                onRemoved={handleRemoveItem}
              />
            ))}
          </>
        )}
      </div>

      <BottomNav/>
      <style>{VAULT_CSS}</style>

      {showDelete && (
        <DeleteCollectionSheet
          name={col.name}
          onConfirm={handleDeleteCollection}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
