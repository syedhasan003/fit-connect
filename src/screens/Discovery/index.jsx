import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGyms, fetchChains } from "../../api/discovery";
import { getCurrentUser } from "../../api/user";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:       "#F7F7F9",
  surface:  "#FFFFFF",
  border:   "#EFEFEF",
  text:     "#111111",
  sub:      "#8A8A8E",
  purple:   "#7C3AED",
  purpleL:  "#EDE9FE",
  shadow:   "0 2px 16px rgba(0,0,0,0.06)",
  shadowMd: "0 6px 24px rgba(0,0,0,0.10)",
  rad:      20,
};

// ─────────────────────────────────────────────────────────────────────────────
// Category config
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "Gyms",      key: "gym",        from: "#7C3AED", to: "#6366f1", emoji: "🏋️" },
  { label: "Trainers",  key: "trainer",    from: "#EA580C", to: "#F59E0B", emoji: "🧑‍🏫" },
  { label: "Turfs",     key: "turf",       from: "#16A34A", to: "#22D3EE", emoji: "⚽" },
  { label: "Swimming",  key: "swimming",   from: "#0284C7", to: "#06B6D4", emoji: "🏊" },
  { label: "Yoga",      key: "yoga",       from: "#DB2777", to: "#A855F7", emoji: "🧘" },
  { label: "Boxing",    key: "boxing",     from: "#DC2626", to: "#EA580C", emoji: "🥊" },
  { label: "Cricket",   key: "cricket",    from: "#D97706", to: "#F97316", emoji: "🏏" },
  { label: "Football",  key: "football",   from: "#65A30D", to: "#16A34A", emoji: "🥅" },
  { label: "Badminton", key: "badminton",  from: "#0D9488", to: "#0284C7", emoji: "🏸" },
  { label: "Squash",    key: "squash",     from: "#7C3AED", to: "#DB2777", emoji: "🎾" },
];

// Consistent gradient per gym name
function gradientForName(name = "") {
  const p = [
    ["#7C3AED","#6366f1"], ["#6366f1","#3B82F6"], ["#DB2777","#A855F7"],
    ["#0D9488","#06B6D4"], ["#EA580C","#F59E0B"], ["#16A34A","#06B6D4"],
    ["#7C3AED","#DB2777"], ["#0284C7","#06B6D4"],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return { from: p[Math.abs(h) % p.length][0], to: p[Math.abs(h) % p.length][1] };
}

const CITIES = [
  { label: "Chennai",    lat: 13.0827, lng: 80.2707 },
  { label: "Mumbai",     lat: 19.0760, lng: 72.8777 },
  { label: "Bangalore",  lat: 12.9716, lng: 77.5946 },
  { label: "Delhi",      lat: 28.6139, lng: 77.2090 },
  { label: "Hyderabad",  lat: 17.3850, lng: 78.4867 },
  { label: "Pune",       lat: 18.5204, lng: 73.8567 },
  { label: "Kolkata",    lat: 22.5726, lng: 88.3639 },
  { label: "Coimbatore", lat: 11.0168, lng: 76.9558 },
];

// ─────────────────────────────────────────────────────────────────────────────
// City picker
// ─────────────────────────────────────────────────────────────────────────────
function CityPicker({ onSelect }) {
  return (
    <div style={{
      position:"fixed",inset:0,zIndex:300,
      background:"rgba(0,0,0,0.28)",
      display:"flex",alignItems:"flex-end",
    }}>
      <div style={{
        width:"100%",background:T.surface,
        borderRadius:"24px 24px 0 0",
        padding:"20px 20px 52px",
        boxShadow:"0 -8px 32px rgba(0,0,0,0.08)",
      }}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border,margin:"0 auto 24px"}}/>
        <p style={{fontSize:18,fontWeight:700,color:T.text,marginBottom:4}}>Choose your city</p>
        <p style={{fontSize:13,color:T.sub,marginBottom:20}}>We'll show outlets near this city</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {CITIES.map(city=>(
            <button key={city.label} onClick={()=>onSelect(city)} style={{
              padding:"14px 16px",borderRadius:14,cursor:"pointer",
              border:`1.5px solid ${T.border}`,background:"#F9FAFB",
              color:T.text,fontSize:15,fontWeight:500,textAlign:"left",
            }}>{city.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Horizontal scroll row with snap
// ─────────────────────────────────────────────────────────────────────────────
function SwipeRow({ children, gap=12, pl=20, pr=20 }) {
  return (
    <div style={{
      display:"flex",overflowX:"auto",gap,
      paddingLeft:pl,paddingRight:pr,paddingBottom:6,
      scrollSnapType:"x mandatory",
      WebkitOverflowScrolling:"touch",
      scrollbarWidth:"none",
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, subtitle, onSeeAll, children }) {
  return (
    <div style={{marginBottom:32}}>
      <div style={{
        display:"flex",justifyContent:"space-between",
        alignItems:"flex-end",marginBottom:14,
        padding:"0 20px",
      }}>
        <div>
          <p style={{fontSize:18,fontWeight:800,color:T.text,letterSpacing:-0.3}}>{title}</p>
          {subtitle && <p style={{fontSize:12,color:T.sub,marginTop:2}}>{subtitle}</p>}
        </div>
        {onSeeAll && (
          <button onClick={onSeeAll} style={{
            background:"none",border:"none",cursor:"pointer",
            fontSize:13,color:T.purple,fontWeight:700,
          }}>See all</button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category tile (Popular row)
// ─────────────────────────────────────────────────────────────────────────────
function CategoryTile({ cat, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display:"flex",flexDirection:"column",alignItems:"center",
      gap:7,cursor:"pointer",flexShrink:0,scrollSnapAlign:"start",
      userSelect:"none",
    }}>
      <div style={{
        width:64,height:64,borderRadius:20,
        background: active
          ? `linear-gradient(135deg,${cat.from},${cat.to})`
          : T.surface,
        border: active ? "none" : `1.5px solid ${T.border}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:28,
        boxShadow: active ? `0 6px 18px ${cat.from}44` : T.shadow,
        transition:"all 0.18s ease",
      }}>
        {cat.emoji}
      </div>
      <span style={{
        fontSize:11,fontWeight:active?700:500,
        color:active?cat.from:T.sub,
        transition:"color 0.18s",
      }}>{cat.label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Outlet card (standard — portrait)
// ─────────────────────────────────────────────────────────────────────────────
function OutletCard({ gym, onClick }) {
  const {from,to} = gradientForName(gym.name);
  const initial = (gym.name||"?")[0].toUpperCase();
  const isOpen = gym.open_now;

  return (
    <div onClick={onClick} style={{
      width:170,flexShrink:0,
      borderRadius:T.rad,overflow:"hidden",
      background:T.surface,border:`1px solid ${T.border}`,
      cursor:"pointer",boxShadow:T.shadow,
      scrollSnapAlign:"start",
      transition:"transform 0.15s,box-shadow 0.15s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=T.shadowMd;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=T.shadow;}}
    >
      {/* Gradient top strip */}
      <div style={{height:5,background:`linear-gradient(90deg,${from},${to})`}}/>

      <div style={{padding:"14px 13px 13px"}}>
        {/* Icon + badges */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:11}}>
          <div style={{
            width:46,height:46,borderRadius:14,flexShrink:0,
            background:`linear-gradient(135deg,${from},${to})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 4px 12px ${from}33`,
          }}>
            <span style={{fontSize:20,fontWeight:900,color:"rgba(255,255,255,0.92)",lineHeight:1}}>{initial}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            {gym.is_sponsored && (
              <span style={{
                fontSize:8,fontWeight:800,letterSpacing:"0.06em",
                padding:"2px 6px",borderRadius:4,
                background:"#FEF3C7",color:"#D97706",border:"1px solid #FDE68A",
              }}>AD</span>
            )}
            {gym.is_premium && (
              <span style={{
                fontSize:8,fontWeight:800,letterSpacing:"0.06em",
                padding:"2px 6px",borderRadius:4,
                background:T.purpleL,color:T.purple,
              }}>PRO</span>
            )}
          </div>
        </div>

        {/* Name */}
        <p style={{
          fontSize:13,fontWeight:700,color:T.text,
          marginBottom:3,lineHeight:"1.25",
          overflow:"hidden",display:"-webkit-box",
          WebkitLineClamp:2,WebkitBoxOrient:"vertical",
        }}>{gym.name}</p>

        {/* Chain badge */}
        {gym.chain_name && (
          <p style={{
            fontSize:10,color:T.purple,fontWeight:700,
            marginBottom:3,
          }}>{gym.chain_name}</p>
        )}

        {/* Address */}
        <p style={{
          fontSize:11,color:T.sub,marginBottom:10,
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
        }}>{gym.address?.split(",")[0]||"—"}</p>

        {/* Footer row */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          paddingTop:9,borderTop:`1px solid ${T.border}`,
        }}>
          <span style={{fontSize:12,color:"#F59E0B",fontWeight:700}}>
            ★ {gym.rating?.toFixed(1)??"—"}
          </span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {isOpen != null && (
              <span style={{
                fontSize:9,fontWeight:700,
                color: isOpen?"#16A34A":"#DC2626",
              }}>{isOpen?"OPEN":"CLOSED"}</span>
            )}
            {gym.distance_km!=null && (
              <span style={{fontSize:11,color:T.sub}}>
                {gym.distance_km<1
                  ?`${(gym.distance_km*1000).toFixed(0)}m`
                  :`${gym.distance_km.toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sponsored card (wider, stands out)
// ─────────────────────────────────────────────────────────────────────────────
function SponsoredCard({ gym, onClick }) {
  const {from,to} = gradientForName(gym.name);
  const initial = (gym.name||"?")[0].toUpperCase();

  return (
    <div onClick={onClick} style={{
      width:"calc(100vw - 48px)",maxWidth:360,flexShrink:0,
      borderRadius:T.rad,overflow:"hidden",
      background:T.surface,
      border:`1.5px solid #FDE68A`,
      cursor:"pointer",
      boxShadow:"0 4px 20px rgba(217,119,6,0.12)",
      scrollSnapAlign:"start",
      transition:"transform 0.15s,box-shadow 0.15s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(217,119,6,0.20)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 20px rgba(217,119,6,0.12)";}}
    >
      {/* Gradient strip */}
      <div style={{height:6,background:`linear-gradient(90deg,${from},${to})`}}/>

      <div style={{padding:"14px 16px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Icon */}
          <div style={{
            width:52,height:52,borderRadius:15,flexShrink:0,
            background:`linear-gradient(135deg,${from},${to})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 4px 14px ${from}44`,
          }}>
            <span style={{fontSize:24,fontWeight:900,color:"rgba(255,255,255,0.92)",lineHeight:1}}>{initial}</span>
          </div>
          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <p style={{
                fontSize:14,fontWeight:800,color:T.text,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
              }}>{gym.name}</p>
              <span style={{
                fontSize:8,fontWeight:800,letterSpacing:"0.06em",
                padding:"2px 6px",borderRadius:4,flexShrink:0,
                background:"#FEF3C7",color:"#D97706",border:"1px solid #FDE68A",
              }}>SPONSORED</span>
            </div>
            {gym.chain_name && (
              <p style={{fontSize:11,color:T.purple,fontWeight:700,marginBottom:2}}>{gym.chain_name}</p>
            )}
            <p style={{fontSize:12,color:T.sub,marginBottom:6}}>
              {gym.address?.split(",")[0]}
            </p>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:13,fontWeight:700,color:"#F59E0B"}}>★ {gym.rating?.toFixed(1)}</span>
              {gym.distance_km!=null && (
                <span style={{fontSize:12,color:T.sub}}>
                  {gym.distance_km<1?`${(gym.distance_km*1000).toFixed(0)}m`:`${gym.distance_km.toFixed(1)}km`}
                </span>
              )}
              {gym.open_now!=null && (
                <span style={{fontSize:10,fontWeight:700,color:gym.open_now?"#16A34A":"#DC2626"}}>
                  {gym.open_now?"Open Now":"Closed"}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Tags */}
        {gym.tags?.length>0 && (
          <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
            {gym.tags.slice(0,4).map(t=>(
              <span key={t} style={{
                fontSize:10,fontWeight:600,
                padding:"3px 8px",borderRadius:999,
                background:T.purpleL,color:T.purple,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium card (landscape, wider)
// ─────────────────────────────────────────────────────────────────────────────
function PremiumCard({ gym, onClick }) {
  const {from,to} = gradientForName(gym.name);
  const initial = (gym.name||"?")[0].toUpperCase();

  return (
    <div onClick={onClick} style={{
      width:"calc(100vw - 80px)",maxWidth:320,flexShrink:0,
      borderRadius:T.rad,overflow:"hidden",
      background:T.surface,
      border:`1.5px solid ${T.purpleL}`,
      cursor:"pointer",
      boxShadow:"0 4px 20px rgba(124,58,237,0.10)",
      scrollSnapAlign:"start",
      transition:"transform 0.15s,box-shadow 0.15s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(124,58,237,0.18)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 20px rgba(124,58,237,0.10)";}}
    >
      <div style={{height:6,background:`linear-gradient(90deg,${from},${to})`}}/>
      <div style={{padding:"13px 14px 13px"}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{
            width:48,height:48,borderRadius:14,flexShrink:0,
            background:`linear-gradient(135deg,${from},${to})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 4px 12px ${from}44`,
          }}>
            <span style={{fontSize:22,fontWeight:900,color:"rgba(255,255,255,0.9)",lineHeight:1}}>{initial}</span>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <p style={{
                fontSize:13,fontWeight:800,color:T.text,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
              }}>{gym.name}</p>
              <span style={{
                fontSize:8,fontWeight:800,letterSpacing:"0.06em",
                padding:"2px 6px",borderRadius:4,flexShrink:0,
                background:`linear-gradient(135deg,${from},${to})`,color:"#fff",
              }}>PRO</span>
            </div>
            {gym.chain_name && (
              <p style={{fontSize:10,color:T.purple,fontWeight:700,marginBottom:2}}>{gym.chain_name}</p>
            )}
            <p style={{fontSize:11,color:T.sub,marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {gym.address?.split(",")[0]}
            </p>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,fontWeight:700,color:"#F59E0B"}}>★ {gym.rating?.toFixed(1)??'—'}</span>
              {gym.distance_km!=null && (
                <span style={{fontSize:11,color:T.sub}}>
                  {gym.distance_km<1?`${(gym.distance_km*1000).toFixed(0)}m`:`${gym.distance_km.toFixed(1)}km`}
                </span>
              )}
            </div>
          </div>
        </div>
        {gym.tags?.length>0 && (
          <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
            {gym.tags.slice(0,3).map(t=>(
              <span key={t} style={{
                fontSize:10,fontWeight:600,
                padding:"3px 8px",borderRadius:999,
                background:T.purpleL,color:T.purple,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chain card (brand card for the "Chains near you" row)
// ─────────────────────────────────────────────────────────────────────────────
function ChainCard({ chain, onClick }) {
  const {from,to} = gradientForName(chain.chain_name);
  const initial = (chain.chain_name||"?")[0].toUpperCase();

  return (
    <div onClick={onClick} style={{
      width:150,flexShrink:0,
      borderRadius:T.rad,overflow:"hidden",
      background:T.surface,border:`1px solid ${T.border}`,
      cursor:"pointer",boxShadow:T.shadow,
      scrollSnapAlign:"start",
      transition:"transform 0.15s,box-shadow 0.15s",
    }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=T.shadowMd;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=T.shadow;}}
    >
      {/* Full gradient header — more visual for brands */}
      <div style={{
        height:72,
        background:`linear-gradient(135deg,${from},${to})`,
        display:"flex",alignItems:"center",justifyContent:"center",
        position:"relative",
      }}>
        <span style={{
          fontSize:32,fontWeight:900,
          color:"rgba(255,255,255,0.22)",
          userSelect:"none",letterSpacing:-2,
        }}>{initial}</span>
        {/* Branch count badge */}
        <span style={{
          position:"absolute",top:8,right:8,
          fontSize:9,fontWeight:800,
          padding:"2px 7px",borderRadius:20,
          background:"rgba(0,0,0,0.25)",color:"#fff",
          backdropFilter:"blur(4px)",
        }}>{chain.branch_count} {chain.branch_count===1?"branch":"branches"}</span>
      </div>

      <div style={{padding:"10px 11px 11px"}}>
        <p style={{
          fontSize:12,fontWeight:800,color:T.text,
          marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
        }}>{chain.chain_name}</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {chain.avg_rating && (
            <span style={{fontSize:11,fontWeight:700,color:"#F59E0B"}}>★ {chain.avg_rating}</span>
          )}
          <span style={{fontSize:10,color:T.sub}}>
            {chain.nearest_km<1
              ?`${(chain.nearest_km*1000).toFixed(0)}m`
              :`${chain.nearest_km.toFixed(1)}km`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────────────────────────────────────
function Skel({ w=170, h=200 }) {
  return (
    <div style={{
      width:w,flexShrink:0,borderRadius:T.rad,overflow:"hidden",
      background:T.surface,border:`1px solid ${T.border}`,scrollSnapAlign:"start",
    }}>
      <div style={{height:5,background:"#E5E7EB"}}/>
      <div style={{padding:14}}>
        <div style={{
          width:46,height:46,borderRadius:14,marginBottom:11,
          background:"linear-gradient(90deg,#E5E7EB 25%,#F3F4F6 50%,#E5E7EB 75%)",
          backgroundSize:"200% 100%",animation:"shimmer 1.4s infinite",
        }}/>
        <div style={{height:12,width:"80%",borderRadius:6,background:"#E5E7EB",marginBottom:6}}/>
        <div style={{height:10,width:"55%",borderRadius:6,background:"#F3F4F6",marginBottom:10}}/>
        <div style={{height:1,background:"#F3F4F6",marginBottom:8}}/>
        <div style={{height:10,width:"40%",borderRadius:6,background:"#F3F4F6"}}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Discovery screen
// ─────────────────────────────────────────────────────────────────────────────
export default function Discovery() {
  const navigate = useNavigate();
  const [gyms,     setGyms]     = useState([]);
  const [chains,   setChains]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [location, setLocation] = useState(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // User first name
  useEffect(() => {
    getCurrentUser()
      .then(u => setFirstName((u?.full_name||u?.username||"").split(" ")[0]))
      .catch(()=>{});
  }, []);

  // GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) { setShowCityPicker(true); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Near you" }),
      ()  => setShowCityPicker(true),
      { timeout: 6000 }
    );
  }, []);

  // Fetch gyms + chains together
  const loadData = useCallback(async (loc) => {
    if (!loc) return;
    setLoading(true);
    try {
      const [gymData, chainData] = await Promise.all([
        fetchGyms({ lat: loc.lat, lng: loc.lng, radiusKm: 8, sortBy: "distance", limit: 50 }),
        fetchChains(loc.lat, loc.lng, 15).catch(()=>[]),
      ]);
      setGyms(gymData.filter(g => !g.rating || g.rating >= 3));
      setChains(chainData);
    } catch(e) {
      console.error("[Discovery] load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(location); }, [location, loadData]);

  // Filtered gyms
  const filtered = activeCategory
    ? gyms.filter(g => g.category === activeCategory || g.tags?.some(t=>t.toLowerCase().includes(activeCategory)))
    : gyms;

  const sponsored    = filtered.filter(g => g.is_sponsored).sort((a,b) => a.sponsored_rank - b.sponsored_rank);
  const premium      = filtered.filter(g => (g.is_premium || g.tags?.includes("Premium")) && !g.is_sponsored);
  const recommended  = filtered.filter(g => !g.is_premium && !g.is_sponsored && !g.tags?.includes("Premium"));
  const nearby       = filtered.slice(0, 12);

  // Time-based greeting
  const hr = new Date().getHours();
  const greeting = hr<12 ? "Good Morning" : hr<17 ? "Good Afternoon" : "Good Evening";

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        *{-webkit-overflow-scrolling:touch}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {showCityPicker && (
        <CityPicker onSelect={city => {
          setLocation({ lat: city.lat, lng: city.lng, label: city.label });
          setShowCityPicker(false);
        }}/>
      )}

      <div style={{background:T.bg,minHeight:"100vh",paddingBottom:80}}>

        {/* ── Sticky header ─────────────────────────────────────────── */}
        <div style={{
          position:"sticky",top:0,zIndex:10,
          background:T.surface,
          borderBottom:`1px solid ${T.border}`,
          padding:"16px 20px 14px",
        }}>
          {/* Row 1: Avatar + greeting + actions */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              {/* Avatar */}
              <div style={{
                width:40,height:40,borderRadius:"50%",flexShrink:0,
                background:`linear-gradient(135deg,${T.purple},#6366f1)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:`0 3px 10px ${T.purple}44`,
              }}>
                <span style={{fontSize:16,fontWeight:900,color:"rgba(255,255,255,0.9)",userSelect:"none"}}>
                  {firstName?firstName[0].toUpperCase():"?"}
                </span>
              </div>
              <div>
                <p style={{fontSize:11,color:T.sub,lineHeight:1,marginBottom:1}}>
                  {firstName?`Hi ${firstName}`:"Welcome"}
                </p>
                <p style={{fontSize:17,fontWeight:900,color:T.text,lineHeight:1.2,letterSpacing:-0.3}}>
                  {greeting}
                </p>
              </div>
            </div>

            {/* Right side: location + bell */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setShowCityPicker(true)} style={{
                display:"flex",alignItems:"center",gap:4,
                padding:"6px 12px",borderRadius:20,
                border:`1.5px solid ${T.border}`,background:"#F9FAFB",
                color:T.sub,fontSize:11,cursor:"pointer",fontWeight:600,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {location?.label||"Set city"}
              </button>
              <button style={{
                width:36,height:36,borderRadius:"50%",
                background:"#F3F4F6",border:"none",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Row 2: Search + filter button */}
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
            <div style={{
              flex:1,display:"flex",alignItems:"center",gap:10,
              padding:"11px 16px",borderRadius:14,
              background:"#F3F4F6",border:`1.5px solid ${T.border}`,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{fontSize:14,color:"#9CA3AF"}}>Gyms, turfs, trainers…</span>
            </div>
            {/* Filter button */}
            <button
              onClick={()=>setShowFilterPanel(!showFilterPanel)}
              style={{
                width:44,height:44,borderRadius:14,flexShrink:0,
                background:`linear-gradient(135deg,${T.purple},#6366f1)`,
                border:"none",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:`0 4px 14px ${T.purple}44`,
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Row 3: Category strip */}
          <div style={{
            display:"flex",gap:10,
            overflowX:"auto",scrollbarWidth:"none",
            paddingBottom:2,
          }}>
            {CATEGORIES.map(cat=>(
              <CategoryTile
                key={cat.key} cat={cat}
                active={activeCategory===cat.key}
                onClick={()=>setActiveCategory(activeCategory===cat.key?null:cat.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div style={{paddingTop:24}}>

          {/* SPONSORED */}
          {(loading || sponsored.length>0) && (
            <Section title="Sponsored" subtitle="Featured outlets near you">
              {loading ? (
                <SwipeRow>
                  {[0,1].map(i=><Skel key={i} w={300}/>)}
                </SwipeRow>
              ) : (
                <SwipeRow>
                  {sponsored.map(g=>(
                    <SponsoredCard key={g.id} gym={g} onClick={()=>navigate(`/gym/${g.id}`)}/>
                  ))}
                </SwipeRow>
              )}
            </Section>
          )}

          {/* POPULAR CHAINS */}
          {(loading || chains.length>0) && (
            <Section title="Chains near you" subtitle="Brand outlets with multiple branches">
              {loading ? (
                <SwipeRow gap={10}>
                  {[0,1,2,3].map(i=><Skel key={i} w={150} h={150}/>)}
                </SwipeRow>
              ) : (
                <SwipeRow gap={10}>
                  {chains.map(c=>(
                    <ChainCard
                      key={c.chain_name}
                      chain={c}
                      onClick={()=>navigate(`/gym/${c.nearest_id}`)}
                    />
                  ))}
                </SwipeRow>
              )}
            </Section>
          )}

          {/* RECOMMENDED */}
          <Section title="Recommended" subtitle="Top rated near you" onSeeAll={()=>{}}>
            {loading ? (
              <SwipeRow>
                {[0,1,2,3].map(i=><Skel key={i}/>)}
              </SwipeRow>
            ) : recommended.length===0 ? (
              <p style={{fontSize:13,color:T.sub,textAlign:"center",padding:"20px 20px"}}>
                No outlets found near you
              </p>
            ) : (
              <SwipeRow>
                {recommended.slice(0,10).map(g=>(
                  <OutletCard key={g.id} gym={g} onClick={()=>navigate(`/gym/${g.id}`)}/>
                ))}
              </SwipeRow>
            )}
          </Section>

          {/* PREMIUM */}
          {(loading || premium.length>0) && (
            <Section title="Premium" subtitle="Elite fitness experiences" onSeeAll={()=>{}}>
              {loading ? (
                <SwipeRow>
                  {[0,1,2].map(i=><Skel key={i} w={300}/>)}
                </SwipeRow>
              ) : (
                <SwipeRow>
                  {premium.map(g=>(
                    <PremiumCard key={g.id} gym={g} onClick={()=>navigate(`/gym/${g.id}`)}/>
                  ))}
                </SwipeRow>
              )}
            </Section>
          )}

          {/* NEARBY — all gyms */}
          <Section title="Nearby" subtitle="Everything around you">
            {loading ? (
              <SwipeRow>
                {[0,1,2,3].map(i=><Skel key={i}/>)}
              </SwipeRow>
            ) : (
              <SwipeRow>
                {nearby.map(g=>(
                  <OutletCard key={g.id} gym={g} onClick={()=>navigate(`/gym/${g.id}`)}/>
                ))}
              </SwipeRow>
            )}
          </Section>

        </div>
      </div>
    </>
  );
}
