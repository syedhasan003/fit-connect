import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import { fetchCollections, createCollection } from "../../api/vault";
import { T, VAULT_CSS, relDate } from "../Vault/vaultDesign";

const A = { color: T.warn, dim: "rgba(249,115,22,0.12)", glow: "rgba(249,115,22,0.24)" };

// Color presets for new collections
const COLORS = [
  "#F97316", "#A855F7", "#7ADE00", "#3B82F6",
  "#22C55E", "#EF4444", "#F59E0B", "#06B6D4",
];

function Skel({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg,${T.s2} 25%,${T.s3} 50%,${T.s2} 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style,
    }}/>
  );
}

// ── Create collection panel ───────────────────────────────────────────────────
function CreateSheet({ onClose, onCreate }) {
  const [name, setName]   = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy]   = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const col = await createCollection({ name: name.trim(), color });
      onCreate(col);
    } catch (e) {
      console.error("Failed to create collection:", e);
    } finally {
      setBusy(false);
    }
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

        <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 16px" }}>New Collection</p>

        {/* Name input */}
        <input
          autoFocus
          placeholder="Collection name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCreate()}
          style={{
            width:"100%", padding:"12px 14px", marginBottom:16,
            background:T.bg, border:`1px solid ${T.border}`,
            borderRadius:12, fontSize:14, color:T.t1,
            fontFamily:"'Inter',sans-serif", outline:"none",
          }}
        />

        {/* Color picker */}
        <p style={{ fontSize:11, color:T.t3, fontWeight:700, letterSpacing:"0.5px", margin:"0 0 10px" }}>COLOR</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width:28, height:28, borderRadius:"50%", background:c, border:"none",
                cursor:"pointer", outline:"none",
                boxShadow: color === c ? `0 0 0 3px ${T.bg}, 0 0 0 5px ${c}` : "none",
                transition:"box-shadow .15s",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{
            flex:1, padding:"13px", borderRadius:12,
            border:`1px solid ${T.border}`, background:"none",
            color:T.t1, fontSize:14, fontWeight:700, cursor:"pointer",
            fontFamily:"'Inter',sans-serif",
          }}>Cancel</button>
          <button
            onClick={handleCreate}
            disabled={busy || !name.trim()}
            style={{
              flex:1, padding:"13px", borderRadius:12,
              border:"none", background:A.color,
              color:"#000", fontSize:14, fontWeight:700,
              cursor: (busy || !name.trim()) ? "default" : "pointer",
              opacity: (busy || !name.trim()) ? .5 : 1,
              fontFamily:"'Inter',sans-serif",
            }}
          >{busy ? "Creating…" : "Create"}</button>
        </div>
      </div>
    </>
  );
}

// ── Collection card ───────────────────────────────────────────────────────────
function CollectionCard({ col, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding:16, marginBottom:10, cursor:"pointer",
        background:T.s2,
        border:`1px solid ${hover ? col.color + "55" : T.border}`,
        borderRadius:T.rad,
        transform: hover ? "scale(1.01)" : "scale(1)",
        boxShadow: hover ? `0 0 16px ${col.color}33` : "none",
        transition:"border-color .15s, transform .15s, box-shadow .15s",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        {/* Color orb */}
        <div style={{
          width:40, height:40, borderRadius:12, flexShrink:0,
          background:`${col.color}20`, border:`1px solid ${col.color}30`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <div style={{ width:14, height:14, borderRadius:"50%", background:col.color }}/>
        </div>

        <div style={{ flex:1 }}>
          <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:"0 0 3px" }}>{col.name}</p>
          {col.description && (
            <p style={{ fontSize:12, color:T.t3, margin:"0 0 6px" }}>{col.description}</p>
          )}
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{
              padding:"3px 8px", borderRadius:6,
              background:`${col.color}18`, border:`1px solid ${col.color}28`,
              fontSize:10, fontWeight:700, color:col.color,
            }}>{col.item_count} item{col.item_count !== 1 ? "s" : ""}</span>
            <span style={{ fontSize:10, color:T.t3 }}>{relDate(col.created_at)}</span>
          </div>
        </div>

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3L9 7L5 11" stroke={T.t3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CollectionsList() {
  const navigate = useNavigate();
  const [cols, setCols]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]     = useState("");
  const [focus, setFocus]       = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await fetchCollections();
      setCols(data || []);
    } catch (e) {
      console.error("Failed to load collections:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (col) => {
    setCols(prev => [col, ...prev]);
    setShowCreate(false);
    navigate(`/vault/collections/${col.id}`);
  };

  const filtered = cols.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

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
          <span style={{ fontSize:13, color:A.color, fontWeight:600 }}>Vault</span>
        </button>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
          <div style={{
            width:36, height:36, borderRadius:11, background:A.dim,
            border:`1px solid ${A.color}28`,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="2" stroke={A.color} strokeWidth="1.6"/>
              <rect x="12" y="3" width="7" height="7" rx="2" stroke={A.color} strokeWidth="1.6"/>
              <rect x="3" y="12" width="7" height="7" rx="2" stroke={A.color} strokeWidth="1.6"/>
              <rect x="12" y="12" width="7" height="7" rx="2" stroke={A.color} strokeWidth="1.6"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize:22, fontWeight:900, color:T.t1, margin:0, letterSpacing:"-0.5px" }}>Collections</p>
            <p style={{ fontSize:12, color:T.t3, margin:"2px 0 0" }}>
              {loading ? "Loading…" : `${cols.length} collection${cols.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position:"relative", margin:"14px 0 18px" }}>
          <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }}
            width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke={T.t3} strokeWidth="1.4"/>
            <path d="M10.5 10.5L14 14" stroke={T.t3} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text" placeholder="Search collections…" value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            style={{
              width:"100%", padding:"12px 14px 12px 36px",
              background:T.s2, border:`1px solid ${focus ? A.color : T.border}`,
              borderRadius:14, fontSize:14, color:T.t1,
              fontFamily:"'Inter',sans-serif", outline:"none",
              boxShadow: focus ? `0 0 0 3px ${A.dim}` : "none",
              transition:"border-color .15s, box-shadow .15s",
            }}
          />
        </div>

        {/* Create new CTA */}
        <button
          onClick={() => setShowCreate(true)}
          style={{
            width:"100%", padding:"13px", borderRadius:14,
            background:"transparent", border:`1px dashed ${A.color}44`,
            color:A.color, fontSize:14, fontWeight:700, cursor:"pointer",
            marginBottom:20, fontFamily:"'Inter',sans-serif",
          }}
        >+ New Collection</button>

      </div>

      {/* List */}
      <div style={{ padding:"0 22px" }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ background:T.s2, border:`1px solid ${T.border}`, borderRadius:T.rad, padding:16, marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <Skel w={40} h={40} r={12}/>
                <div style={{ flex:1 }}>
                  <Skel w="55%" h={14} r={6} style={{ marginBottom:8 }}/>
                  <Skel w="35%" h={20} r={6}/>
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{
              width:64, height:64, borderRadius:20, background:T.s2,
              border:`1px solid ${T.border}`, display:"flex", alignItems:"center",
              justifyContent:"center", margin:"0 auto 20px",
            }}>
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="2" stroke={T.border2} strokeWidth="1.6"/>
                <rect x="12" y="3" width="7" height="7" rx="2" stroke={T.border2} strokeWidth="1.6"/>
                <rect x="3" y="12" width="7" height="7" rx="2" stroke={T.border2} strokeWidth="1.6"/>
                <rect x="12" y="12" width="7" height="7" rx="2" stroke={T.border2} strokeWidth="1.6"/>
              </svg>
            </div>
            <p style={{ fontSize:16, fontWeight:800, color:T.t1, margin:"0 0 8px" }}>
              {search ? "No results" : "No collections yet"}
            </p>
            <p style={{ fontSize:13, color:T.t3, margin:"0 0 24px" }}>
              {search ? "Try a different name" : "Group your vault items into custom collections"}
            </p>
            {!search && (
              <button onClick={() => setShowCreate(true)} style={{
                padding:"12px 28px", borderRadius:12, border:"none",
                background:A.color, color:"#000", fontSize:14, fontWeight:800, cursor:"pointer",
              }}>Create First Collection</button>
            )}
          </div>
        ) : (
          filtered.map(col => (
            <CollectionCard
              key={col.id}
              col={col}
              onClick={() => navigate(`/vault/collections/${col.id}`)}
            />
          ))
        )}
      </div>

      <BottomNav/>
      <style>{VAULT_CSS}</style>

      {showCreate && (
        <CreateSheet onClose={() => setShowCreate(false)} onCreate={handleCreated}/>
      )}
    </div>
  );
}
