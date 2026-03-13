import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchVaultItems } from "../../api/vault";
import { T, VAULT_CSS, relDate } from "../Vault/vaultDesign";
import BottomNav from "../../components/navigation/BottomNav";

const A = { color: T.purple, dim: T.purpleDim, glow: T.purpleGlow };

function Skel({ w = "100%", h = 14, r = 8, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: `linear-gradient(90deg,${T.s2} 25%,${T.s3} 50%,${T.s2} 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", ...style,
    }}/>
  );
}

function SearchBar({ value, onChange, focus, setFocus }) {
  return (
    <div style={{ position: "relative", margin: "14px 0 18px" }}>
      <svg style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }}
        width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="6.5" cy="6.5" r="5" stroke={T.t3} strokeWidth="1.4"/>
        <path d="M10.5 10.5L14 14" stroke={T.t3} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <input
        type="text" placeholder="Search answers…" value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width:"100%", padding:"12px 14px 12px 36px",
          background:T.s2, border:`1px solid ${focus ? A.color : T.border}`,
          borderRadius:14, fontSize:14, color:T.t1,
          fontFamily:"'Inter',sans-serif", outline:"none",
          boxShadow: focus ? `0 0 0 3px ${A.dim}` : "none",
          transition:"border-color .15s,box-shadow .15s",
        }}
      />
    </div>
  );
}

function AnswerCard({ item, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "16px", marginBottom: 10, cursor: "pointer",
        background: T.s2,
        border: `1px solid ${hover ? A.color + "44" : T.border}`,
        borderRadius: T.rad,
        transform: hover ? "scale(1.01)" : "scale(1)",
        boxShadow: hover ? `0 0 18px ${A.glow}` : "none",
        transition: "border-color .15s, transform .15s, box-shadow .15s",
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:0, letterSpacing:"-0.2px", flex:1, paddingRight:10 }}>
          {item.title}
        </p>
        {item.pinned && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, marginTop:2 }}>
            <path d="M9 1L13 5L8.5 9.5L7 13L1 7L4.5 5.5L9 1Z" fill={A.color} stroke={A.color} strokeWidth="1"/>
          </svg>
        )}
      </div>
      {item.summary && (
        <p style={{ fontSize:13, color:T.t2, margin:"0 0 10px", lineHeight:1.5,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {item.summary}
        </p>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{
          width:6, height:6, borderRadius:"50%", background:A.color, flexShrink:0,
        }}/>
        <span style={{ fontSize:11, color:T.t3, fontWeight:600 }}>Central AI</span>
        <span style={{ fontSize:11, color:T.border2 }}>·</span>
        <span style={{ fontSize:11, color:T.t3 }}>{relDate(item.created_at)}</span>
      </div>
    </div>
  );
}

export default function CentralAnswersList() {
  const navigate = useNavigate();
  const [items, setItems]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [search, setSearch] = useState("");
  const [focus, setFocus]   = useState(false);

  useEffect(() => {
    fetchVaultItems()
      .then(data => setItems((data || []).filter(i => i.source === "central")))
      .catch(() => setItems([]))
      .finally(() => setLoad(false));
  }, []);

  const filtered = items.filter(i =>
    !search ||
    i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.summary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, paddingBottom:90, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ padding:"56px 22px 0" }}>
        {/* Back + header */}
        <button onClick={() => navigate(-1)} style={{
          background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:16,
          display:"flex", alignItems:"center", gap:6,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke={A.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:13, color:A.color, fontWeight:600 }}>Vault</span>
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
          <div style={{ width:36, height:36, borderRadius:11, background:A.dim,
            border:`1px solid ${A.color}28`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="4" fill={A.color} opacity=".9"/>
              <path d="M11 2V5M11 17V20M2 11H5M17 11H20" stroke={A.color} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize:22, fontWeight:900, color:T.t1, margin:0, letterSpacing:"-0.5px" }}>Central Answers</p>
            <p style={{ fontSize:12, color:T.t3, margin:"2px 0 0" }}>
              {loading ? "Loading…" : `${items.length} saved response${items.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} focus={focus} setFocus={setFocus}/>
      </div>

      <div style={{ padding:"0 22px" }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ background:T.s2, border:`1px solid ${T.border}`, borderRadius:T.rad, padding:16, marginBottom:10 }}>
              <Skel w="75%" h={15} r={6} style={{ marginBottom:10 }}/>
              <Skel w="100%" h={11} r={5} style={{ marginBottom:6 }}/>
              <Skel w="60%" h={11} r={5} style={{ marginBottom:14 }}/>
              <Skel w="40%" h={10} r={5}/>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ width:64, height:64, borderRadius:20, background:T.s2, border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" fill={T.border2} opacity=".9"/>
                <path d="M11 2V5M11 17V20M2 11H5M17 11H20" stroke={T.border2} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize:16, fontWeight:800, color:T.t1, margin:"0 0 8px" }}>
              {search ? "No results" : "No answers saved yet"}
            </p>
            <p style={{ fontSize:13, color:T.t3, margin:0 }}>
              {search ? "Try a different search term" : "Answers you save from Central AI will appear here"}
            </p>
          </div>
        ) : (
          filtered.map(item => (
            <AnswerCard key={item.id} item={item} onClick={() => navigate(`/vault/central/${item.id}`)}/>
          ))
        )}
      </div>

      <BottomNav/>
      <style>{VAULT_CSS}</style>
    </div>
  );
}
