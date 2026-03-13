import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGyms, fetchChains } from "../../api/discovery";
import { getCurrentUser } from "../../api/user";
import BottomNav from "../../components/navigation/BottomNav";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — aligned with vaultDesign.js Onyx system
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:       "#0A0A0A",
  s1:       "#111111",
  s2:       "#1A1A1A",
  s3:       "#222222",
  border:   "#1E1E1E",
  border2:  "#2A2A2A",
  t1:       "#FFFFFF",
  t2:       "#9CA3AF",
  t3:       "#6B7280",
  lime:     "#7ADE00",
  limeDim:  "rgba(122,222,0,0.10)",
  limeGlow: "rgba(122,222,0,0.22)",
  rad:      16,
};

// ─────────────────────────────────────────────────────────────────────────────
// Category config
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "Gym",       key: "gym"       },
  { label: "Pool",      key: "swimming"  },
  { label: "Yoga",      key: "yoga"      },
  { label: "Boxing",    key: "boxing"    },
  { label: "Turf",      key: "turf"      },
  { label: "Badminton", key: "badminton" },
  { label: "Cricket",   key: "cricket"   },
  { label: "Football",  key: "football"  },
];

const CITIES = [
  { label: "Bengaluru",  lat: 12.9716, lng: 77.5946 },
  { label: "Chennai",    lat: 13.0827, lng: 80.2707 },
  { label: "Mumbai",     lat: 19.0760, lng: 72.8777 },
  { label: "Delhi",      lat: 28.6139, lng: 77.2090 },
  { label: "Hyderabad",  lat: 17.3850, lng: 78.4867 },
  { label: "Pune",       lat: 18.5204, lng: 73.8567 },
  { label: "Kolkata",    lat: 22.5726, lng: 88.3639 },
  { label: "Coimbatore", lat: 11.0168, lng: 76.9558 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function gradientForName(name = "") {
  const palettes = [
    ["#0A1500", "#182800"], ["#000A10", "#001828"], ["#100010", "#200030"],
    ["#100500", "#220E00"], ["#001510", "#002820"], ["#0A0005", "#180012"],
    ["#080A00", "#141800"], ["#000818", "#000E28"],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const [from, to] = palettes[Math.abs(h) % palettes.length];
  return { from, to };
}

function abbrev(name = "") {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function fmtDist(km) {
  if (km == null) return null;
  return km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)} km`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG icons
// ─────────────────────────────────────────────────────────────────────────────
const Icon = {
  search: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke={T.t3} strokeWidth="1.4"/>
      <path d="M10.5 10.5L14 14" stroke={T.t3} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  filter: (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
      <rect x="0" y="0"   width="16" height="1.8" rx="0.9" fill="#000"/>
      <rect x="2.5" y="5" width="11" height="1.8" rx="0.9" fill="#000"/>
      <rect x="5" y="10"  width="6"  height="1.8" rx="0.9" fill="#000"/>
    </svg>
  ),
  bell: (
    <svg width="16" height="17" viewBox="0 0 16 18" fill="none">
      <path d="M8 1C8.55 1 9 1.45 9 2V2.65C11.5 3.1 13.5 5.3 13.5 8V12.5L15 14H1L2.5 12.5V8C2.5 5.3 4.5 3.1 7 2.65V2C7 1.45 7.45 1 8 1Z" stroke={T.t2} strokeWidth="1.4" fill="none"/>
      <path d="M6 15C6.4 15.9 7.1 16.5 8 16.5C8.9 16.5 9.6 15.9 10 15" stroke={T.t2} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  pin: (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
      <path d="M5 0C2.8 0 1 1.8 1 4C1 7 5 12 5 12C5 12 9 7 9 4C9 1.8 7.2 0 5 0Z" fill={T.lime}/>
      <circle cx="5" cy="4" r="1.5" fill="#0A0A0A"/>
    </svg>
  ),
  heart: (
    <svg width="13" height="12" viewBox="0 0 14 13" fill="none">
      <path d="M7 12L1.5 6.5C0.4 5.4 0.4 3.6 1.5 2.5C2.6 1.4 4.4 1.4 5.5 2.5L7 4L8.5 2.5C9.6 1.4 11.4 1.4 12.5 2.5C13.6 3.6 13.6 5.4 12.5 6.5L7 12Z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" fill="none"/>
    </svg>
  ),
  chevron: (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M7 1L11 5L7 9M11 5H1" stroke={T.t3} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  star: (
    <svg width="8" height="8" viewBox="0 0 10 10" fill={T.lime}>
      <path d="M5 0.5L6.2 3.6H9.5L6.9 5.6L7.9 8.8L5 6.9L2.1 8.8L3.1 5.6L0.5 3.6H3.8L5 0.5Z"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// City picker sheet
// ─────────────────────────────────────────────────────────────────────────────
function CityPicker({ onSelect }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      background:"rgba(0,0,0,0.72)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div style={{
        width:"100%", background:T.s2,
        borderRadius:"22px 22px 0 0",
        padding:"20px 20px 52px",
        border:`1px solid ${T.border}`,
        borderBottom:"none",
        animation:"slideUp .25s ease-out",
        fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{ width:36, height:4, borderRadius:2, background:T.border2, margin:"0 auto 24px" }}/>
        <p style={{ fontSize:17, fontWeight:800, color:T.t1, marginBottom:3, letterSpacing:"-0.3px" }}>
          Choose your city
        </p>
        <p style={{ fontSize:12, color:T.t3, marginBottom:20 }}>
          We'll show outlets near this location
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {CITIES.map(city => (
            <button key={city.label} onClick={() => onSelect(city)} style={{
              padding:"13px 16px", borderRadius:12, cursor:"pointer",
              border:`1px solid ${T.border}`, background:T.s3,
              color:T.t1, fontSize:13, fontWeight:700, textAlign:"left",
              fontFamily:"'Inter',sans-serif",
              transition:"border-color .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.lime + "44"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
            >
              {city.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────────────────────────────────────
function SwipeRow({ children, gap = 12, pl = 20, pr = 20 }) {
  return (
    <div style={{
      display:"flex", overflowX:"auto", gap,
      paddingLeft:pl, paddingRight:pr, paddingBottom:6,
      scrollSnapType:"x mandatory",
      WebkitOverflowScrolling:"touch",
      scrollbarWidth:"none",
    }}>
      {children}
    </div>
  );
}

function Section({ title, onSeeAll, children }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:12, padding:"0 20px",
      }}>
        <p style={{ fontSize:14, fontWeight:800, color:T.t1, letterSpacing:"-0.2px", margin:0 }}>
          {title}
        </p>
        {onSeeAll && (
          <button onClick={onSeeAll} style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:11, color:T.t3, fontWeight:600,
            display:"flex", alignItems:"center", gap:4,
            fontFamily:"'Inter',sans-serif",
          }}>
            View all {Icon.chevron}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────
function Skel({ w = 150, h = 175 }) {
  return (
    <div style={{
      width:w, height:h, flexShrink:0, borderRadius:T.rad,
      background:T.s2, border:`1px solid ${T.border}`,
      scrollSnapAlign:"start", overflow:"hidden",
    }}>
      <div style={{
        height:"100%",
        background:`linear-gradient(90deg, ${T.s2} 25%, ${T.s3} 50%, ${T.s2} 75%)`,
        backgroundSize:"200% 100%",
        animation:"shimmer 1.5s infinite",
      }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero card — Sponsored (full-width)
// ─────────────────────────────────────────────────────────────────────────────
function HeroCard({ gym, onClick }) {
  const { from, to } = gradientForName(gym.name);
  const dist = fmtDist(gym.distance_km);

  return (
    <div
      onClick={onClick}
      style={{
        width:"calc(100vw - 52px)", maxWidth:300,
        height:160, flexShrink:0, borderRadius:T.rad,
        overflow:"hidden", position:"relative", cursor:"pointer",
        scrollSnapAlign:"start",
        border:`1px solid ${T.border}`,
      }}
    >
      <div style={{
        position:"absolute", inset:0,
        background:`linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
      }}/>
      <div style={{
        position:"absolute", inset:0,
        background:"radial-gradient(circle at 65% 25%, rgba(122,222,0,0.06) 0%, transparent 55%)",
      }}/>
      <div style={{
        position:"absolute", inset:0,
        background:"linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
      }}/>

      {/* Sponsored badge */}
      <div style={{
        position:"absolute", top:12, left:12,
        background:"rgba(122,222,0,0.12)", border:"1px solid rgba(122,222,0,0.22)",
        color:T.lime, fontSize:9, fontWeight:800,
        padding:"3px 10px", borderRadius:20, letterSpacing:"0.8px",
        textTransform:"uppercase",
      }}>Sponsored</div>

      {/* Chain badge */}
      {gym.chain_name && (
        <div style={{
          position:"absolute", top:12, right:12,
          background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          color:"rgba(255,255,255,0.6)", fontSize:9, fontWeight:700,
          padding:"3px 8px", borderRadius:7, letterSpacing:"0.4px",
          textTransform:"uppercase",
        }}>{gym.chain_name}</div>
      )}

      {/* Content */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 14px" }}>
        <p style={{ fontSize:15, fontWeight:800, color:"#fff", letterSpacing:"-0.3px", lineHeight:1.2, marginBottom:3 }}>
          {gym.name}
        </p>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:8, fontWeight:500 }}>
          {gym.address?.split(",")[0]}
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {gym.rating != null && (
            <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:700, color:T.lime }}>
              {Icon.star} {gym.rating.toFixed(1)}
            </span>
          )}
          {dist && (
            <>
              <span style={{ width:3, height:3, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"inline-block" }}/>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontWeight:500 }}>{dist}</span>
            </>
          )}
          <div style={{ marginLeft:"auto" }}>
            <span style={{
              background:T.lime, color:"#000",
              fontSize:10, fontWeight:800, padding:"5px 14px", borderRadius:20, letterSpacing:"0.3px",
            }}>Book</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chain card (lettermark)
// ─────────────────────────────────────────────────────────────────────────────
function ChainCard({ chain, onClick }) {
  const letters = abbrev(chain.chain_name);

  return (
    <div
      onClick={onClick}
      style={{
        width:118, flexShrink:0, borderRadius:T.rad,
        background:T.s2, border:`1px solid ${T.border}`,
        padding:"14px 12px", scrollSnapAlign:"start",
        cursor:"pointer", textAlign:"center",
        position:"relative", overflow:"hidden",
        transition:"border-color .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
    >
      {/* Lettermark */}
      <div style={{
        width:46, height:46, borderRadius:13,
        background:T.s3, border:`1px solid ${T.border2}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 9px",
      }}>
        <span style={{
          fontSize: letters.length > 2 ? 11 : 14,
          fontWeight:900, color:T.t1, letterSpacing:"-0.5px",
        }}>{letters}</span>
      </div>

      <p style={{
        fontSize:11, fontWeight:700, color:T.t1,
        marginBottom:2, whiteSpace:"nowrap",
        overflow:"hidden", textOverflow:"ellipsis",
      }}>{chain.chain_name}</p>
      <p style={{ fontSize:10, color:T.t3, marginBottom:8 }}>
        {chain.branch_count} {chain.branch_count === 1 ? "branch" : "branches"}
      </p>

      <div style={{
        display:"inline-flex", alignItems:"center", gap:4,
        background:T.limeDim, border:"1px solid rgba(122,222,0,0.12)",
        color:T.lime, fontSize:10, fontWeight:700,
        padding:"3px 9px", borderRadius:20,
      }}>
        {Icon.star}
        {chain.avg_rating ? parseFloat(chain.avg_rating).toFixed(1) : "—"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Outlet card — standard
// ─────────────────────────────────────────────────────────────────────────────
function OutletCard({ gym, onClick }) {
  const { from, to } = gradientForName(gym.name);
  const dist = fmtDist(gym.distance_km);
  const cat = gym.category?.toUpperCase() || "GYM";

  return (
    <div
      onClick={onClick}
      style={{
        width:148, flexShrink:0, borderRadius:T.rad,
        background:T.s2, border:`1px solid ${T.border}`,
        overflow:"hidden", cursor:"pointer", scrollSnapAlign:"start",
        transition:"border-color .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
    >
      {/* Thumb */}
      <div style={{
        height:88, position:"relative",
        background:`linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
      }}>
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
        }}/>
        {/* Fav */}
        <div style={{
          position:"absolute", top:7, right:7,
          width:24, height:24, borderRadius:7,
          background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.07)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {Icon.heart}
        </div>
        {/* Category label */}
        <div style={{
          position:"absolute", bottom:7, left:7,
          background:"rgba(0,0,0,0.5)", border:"1px solid rgba(255,255,255,0.07)",
          color:"rgba(255,255,255,0.6)", fontSize:8, fontWeight:700,
          padding:"2px 6px", borderRadius:5, letterSpacing:"0.5px",
        }}>{cat}</div>
        {/* Sponsored micro badge */}
        {gym.is_sponsored && (
          <div style={{
            position:"absolute", top:7, left:7,
            background:T.limeDim, border:"1px solid rgba(122,222,0,0.2)",
            color:T.lime, fontSize:8, fontWeight:800,
            padding:"2px 6px", borderRadius:5,
          }}>AD</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:"9px 10px 11px" }}>
        <p style={{
          fontSize:12, fontWeight:700, color:T.t1, lineHeight:1.3,
          letterSpacing:"-0.2px", marginBottom:2,
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical",
        }}>{gym.name}</p>
        {gym.chain_name && (
          <p style={{ fontSize:9, color:T.lime, fontWeight:700, marginBottom:2, letterSpacing:"0.3px", textTransform:"uppercase" }}>
            {gym.chain_name}
          </p>
        )}
        <p style={{
          fontSize:9, color:T.t3, marginBottom:7,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>
          {gym.address?.split(",")[0] || "—"}
        </p>

        {/* Footer */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          paddingTop:7, borderTop:`1px solid ${T.border}`,
        }}>
          <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700, color:T.t1 }}>
            {Icon.star} {gym.rating?.toFixed(1) ?? "—"}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            {gym.open_now != null && (
              <span style={{ fontSize:8, fontWeight:700, color: gym.open_now ? "#4ADE80" : "#F87171" }}>
                {gym.open_now ? "OPEN" : "CLOSED"}
              </span>
            )}
            {dist && <span style={{ fontSize:9, color:T.t3 }}>{dist}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium card — wider, lime top accent
// ─────────────────────────────────────────────────────────────────────────────
function PremiumCard({ gym, onClick }) {
  const { from, to } = gradientForName(gym.name);
  const dist = fmtDist(gym.distance_km);

  return (
    <div
      onClick={onClick}
      style={{
        width:"calc(100vw - 80px)", maxWidth:215,
        flexShrink:0, borderRadius:T.rad, overflow:"hidden",
        background:T.s2, border:`1px solid ${T.border}`,
        cursor:"pointer", scrollSnapAlign:"start",
        transition:"border-color .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.lime + "40"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
    >
      {/* Lime top accent line */}
      <div style={{ height:2, background:T.lime, opacity:0.7 }}/>

      {/* Thumb */}
      <div style={{
        height:108, position:"relative",
        background:`linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
      }}>
        <div style={{
          position:"absolute", inset:0,
          background:"radial-gradient(circle at 60% 25%, rgba(122,222,0,0.05) 0%, transparent 55%)",
        }}/>
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)",
        }}/>
        <div style={{
          position:"absolute", top:10, left:10,
          background:T.lime, color:"#000",
          fontSize:9, fontWeight:900, padding:"4px 10px",
          borderRadius:20, letterSpacing:"0.7px", textTransform:"uppercase",
        }}>Premium</div>
      </div>

      {/* Body */}
      <div style={{ padding:"11px 12px 13px" }}>
        <p style={{
          fontSize:12, fontWeight:800, color:T.t1,
          letterSpacing:"-0.2px", lineHeight:1.3, marginBottom:7,
        }}>{gym.name}</p>

        {gym.tags?.length > 0 && (
          <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:9 }}>
            {gym.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{
                background:T.s3, border:`1px solid ${T.border2}`,
                color:T.t3, fontSize:8, fontWeight:600,
                padding:"3px 7px", borderRadius:5, letterSpacing:"0.3px",
              }}>{tag}</span>
            ))}
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:12, fontWeight:800, color:T.lime, letterSpacing:"-0.3px" }}>
            {gym.price_label || "From ₹1,499"}
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:T.t2, fontWeight:600 }}>
            {Icon.star} {gym.rating?.toFixed(1) ?? "—"}
            {dist && <span style={{ color:T.t3, fontSize:9 }}> · {dist}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Discovery screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Discovery() {
  const navigate = useNavigate();
  const [gyms,           setGyms]           = useState([]);
  const [chains,         setChains]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [location,       setLocation]       = useState(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [firstName,      setFirstName]      = useState("");

  useEffect(() => {
    getCurrentUser()
      .then(u => setFirstName((u?.full_name || u?.username || "").split(" ")[0]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setShowCityPicker(true); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Near you" }),
      ()  => setShowCityPicker(true),
      { timeout: 6000 }
    );
  }, []);

  const loadData = useCallback(async (loc) => {
    if (!loc) return;
    setLoading(true);
    try {
      const [gymData, chainData] = await Promise.all([
        fetchGyms({ lat: loc.lat, lng: loc.lng, radiusKm: 8, sortBy: "distance", limit: 50 }),
        fetchChains(loc.lat, loc.lng, 15).catch(() => []),
      ]);
      setGyms(gymData.filter(g => !g.rating || g.rating >= 3));
      setChains(chainData);
    } catch (e) {
      console.error("[Discovery] load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(location); }, [location, loadData]);

  const filtered = activeCategory
    ? gyms.filter(g => g.category === activeCategory || g.tags?.some(t => t.toLowerCase().includes(activeCategory)))
    : gyms;

  const sponsored   = filtered.filter(g => g.is_sponsored).sort((a, b) => a.sponsored_rank - b.sponsored_rank);
  const premium     = filtered.filter(g => (g.is_premium || g.tags?.includes("Premium")) && !g.is_sponsored);
  const recommended = filtered.filter(g => !g.is_premium && !g.is_sponsored && !g.tags?.includes("Premium"));
  const nearby      = filtered.slice(0, 12);

  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing:border-box; -webkit-font-smoothing:antialiased; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {showCityPicker && (
        <CityPicker onSelect={city => {
          setLocation({ lat: city.lat, lng: city.lng, label: city.label });
          setShowCityPicker(false);
        }}/>
      )}

      <div style={{
        background:T.bg, minHeight:"100vh", paddingBottom:88,
        fontFamily:"'Inter', -apple-system, sans-serif",
        color:T.t1,
      }}>

        {/* ── Sticky header ── */}
        <div style={{
          position:"sticky", top:0, zIndex:20,
          background:T.bg,
          borderBottom:`1px solid ${T.border}`,
          padding:"16px 20px 0",
        }}>

          {/* Row 1: greeting + controls */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div>
              <p style={{ fontSize:10, color:T.t3, fontWeight:700, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:3 }}>
                {greeting}
              </p>
              <p style={{ fontSize:22, fontWeight:900, color:T.t1, letterSpacing:"-0.5px", lineHeight:1.1, margin:0 }}>
                {firstName ? `Hey, ${firstName}` : "Hey there"}
              </p>
              <button
                onClick={() => setShowCityPicker(true)}
                style={{
                  display:"flex", alignItems:"center", gap:5, marginTop:6,
                  background:"none", border:"none", cursor:"pointer", padding:0,
                  fontFamily:"'Inter',sans-serif",
                }}
              >
                {Icon.pin}
                <span style={{ fontSize:11, color:T.t2, fontWeight:600 }}>
                  {location?.label || "Set location"}
                </span>
              </button>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:2 }}>
              {/* Bell */}
              <div style={{
                width:38, height:38, borderRadius:11,
                background:T.s2, border:`1px solid ${T.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                position:"relative", cursor:"pointer",
              }}>
                {Icon.bell}
                <div style={{
                  position:"absolute", top:8, right:8,
                  width:6, height:6, borderRadius:3,
                  background:T.lime, border:`1.5px solid ${T.bg}`,
                }}/>
              </div>
              {/* Avatar */}
              <div style={{
                width:38, height:38, borderRadius:11,
                background:T.lime, display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:15, fontWeight:900, color:"#000",
                cursor:"pointer", flexShrink:0,
              }}>
                {firstName ? firstName[0].toUpperCase() : "?"}
              </div>
            </div>
          </div>

          {/* Row 2: Search + Filter */}
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <div style={{
              flex:1, display:"flex", alignItems:"center", gap:9,
              padding:"11px 14px", borderRadius:12,
              background:T.s2, border:`1px solid ${T.border}`,
            }}>
              {Icon.search}
              <span style={{ fontSize:12, color:T.t3, fontWeight:500 }}>
                Search gyms, yoga, courts…
              </span>
            </div>
            <div style={{
              width:44, height:44, borderRadius:12, flexShrink:0,
              background:T.lime, display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", boxShadow:`0 4px 16px ${T.limeGlow}`,
            }}>
              {Icon.filter}
            </div>
          </div>

          {/* Row 3: Category pills */}
          <div style={{
            display:"flex", gap:6, overflowX:"auto",
            paddingBottom:13, scrollbarWidth:"none",
          }}>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  onClick={() => setActiveCategory(active ? null : cat.key)}
                  style={{
                    flexShrink:0, padding:"7px 14px", borderRadius:20,
                    fontSize:12, fontWeight:700, cursor:"pointer",
                    whiteSpace:"nowrap",
                    background: active ? T.lime : T.s2,
                    border: `1px solid ${active ? T.lime : T.border}`,
                    color: active ? "#000" : T.t2,
                    boxShadow: active ? `0 2px 12px ${T.limeGlow}` : "none",
                    transition:"all 0.12s",
                    fontFamily:"'Inter',sans-serif",
                  }}
                >
                  {cat.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ paddingTop:24 }}>

          {/* SPONSORED */}
          {(loading || sponsored.length > 0) && (
            <Section title="Sponsored">
              {loading ? (
                <SwipeRow>
                  {[0, 1].map(i => <Skel key={i} w={280} h={160}/>)}
                </SwipeRow>
              ) : (
                <SwipeRow>
                  {sponsored.map(g => (
                    <HeroCard key={g.id} gym={g} onClick={() => navigate(`/gym/${g.id}`)}/>
                  ))}
                </SwipeRow>
              )}
            </Section>
          )}

          {/* CHAINS */}
          {(loading || chains.length > 0) && (
            <Section title="Chains Near You" onSeeAll={() => {}}>
              {loading ? (
                <SwipeRow gap={10}>
                  {[0, 1, 2, 3].map(i => <Skel key={i} w={118} h={138}/>)}
                </SwipeRow>
              ) : (
                <SwipeRow gap={10}>
                  {chains.map(c => (
                    <ChainCard
                      key={c.chain_name}
                      chain={c}
                      onClick={() => navigate(`/gym/${c.nearest_id}`)}
                    />
                  ))}
                </SwipeRow>
              )}
            </Section>
          )}

          {/* NEAR YOU */}
          <Section title="Near You" onSeeAll={() => {}}>
            {loading ? (
              <SwipeRow>
                {[0, 1, 2, 3].map(i => <Skel key={i}/>)}
              </SwipeRow>
            ) : recommended.length === 0 ? (
              <p style={{ fontSize:12, color:T.t3, textAlign:"center", padding:"24px 20px" }}>
                No outlets found near you
              </p>
            ) : (
              <SwipeRow>
                {recommended.slice(0, 10).map(g => (
                  <OutletCard key={g.id} gym={g} onClick={() => navigate(`/gym/${g.id}`)}/>
                ))}
              </SwipeRow>
            )}
          </Section>

          {/* PREMIUM */}
          {(loading || premium.length > 0) && (
            <Section title="Premium" onSeeAll={() => {}}>
              {loading ? (
                <SwipeRow>
                  {[0, 1, 2].map(i => <Skel key={i} w={215} h={185}/>)}
                </SwipeRow>
              ) : (
                <SwipeRow>
                  {premium.map(g => (
                    <PremiumCard key={g.id} gym={g} onClick={() => navigate(`/gym/${g.id}`)}/>
                  ))}
                </SwipeRow>
              )}
            </Section>
          )}

          {/* NEARBY */}
          <Section title="Nearby">
            {loading ? (
              <SwipeRow>
                {[0, 1, 2, 3].map(i => <Skel key={i}/>)}
              </SwipeRow>
            ) : (
              <SwipeRow>
                {nearby.map(g => (
                  <OutletCard key={g.id} gym={g} onClick={() => navigate(`/gym/${g.id}`)}/>
                ))}
              </SwipeRow>
            )}
          </Section>

        </div>
      </div>
      <BottomNav />
    </>
  );
}
