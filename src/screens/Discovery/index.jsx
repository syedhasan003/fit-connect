import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGyms, fetchGymPhotoBlob } from "../../api/discovery";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const FILTERS = [
  { label: "All",      apiKey: null,          apiParam: null },
  { label: "Near Me",  apiKey: "nearme",      apiParam: null },   // sort by distance
  { label: "Open Now", apiKey: "open_now",    apiParam: { openNow: true } },
  { label: "Premium",  apiKey: "premium",     apiParam: { isPremium: true } },
  { label: "24x7",     apiKey: "24x7",        apiParam: { is24x7: true } },
  { label: "Trainers", apiKey: "trainers",    apiParam: { hasTrainers: true } },
  { label: "Sauna",    apiKey: "sauna",       apiParam: { hasSauna: true } },
  { label: "Pool",     apiKey: "pool",        apiParam: { hasPool: true } },
];

// Major Indian cities for city picker
const CITIES = [
  { label: "Chennai",   lat: 13.0827,  lng: 80.2707  },
  { label: "Mumbai",    lat: 19.0760,  lng: 72.8777  },
  { label: "Bangalore", lat: 12.9716,  lng: 77.5946  },
  { label: "Delhi",     lat: 28.6139,  lng: 77.2090  },
  { label: "Hyderabad", lat: 17.3850,  lng: 78.4867  },
  { label: "Kolkata",   lat: 22.5726,  lng: 88.3639  },
  { label: "Pune",      lat: 18.5204,  lng: 73.8567  },
  { label: "Ahmedabad", lat: 23.0225,  lng: 72.5714  },
  { label: "Coimbatore",lat: 11.0168,  lng: 76.9558  },
  { label: "Madurai",   lat: 9.9252,   lng: 78.1198  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Photo component (handles async blob fetch with auth)
// ─────────────────────────────────────────────────────────────────────────────

function GymPhoto({ photoReferences = [], className = "", height = 160 }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const ref = photoReferences[0];
    if (!ref) return;

    fetchGymPhotoBlob(ref, 600).then((url) => {
      if (mounted.current && url) setBlobUrl(url);
    });

    return () => {
      mounted.current = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoReferences[0]]);

  if (!blobUrl) {
    return (
      <div
        style={{ height, borderRadius: 12, background: "rgba(38,38,42,1)" }}
        className={className}
      />
    );
  }

  return (
    <img
      src={blobUrl}
      alt="gym"
      style={{ height, width: "100%", objectFit: "cover", borderRadius: 12 }}
      className={className}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Star rating
// ─────────────────────────────────────────────────────────────────────────────

function StarRating({ rating }) {
  if (!rating) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <span style={{ color: "#facc15", fontSize: 13 }}>★</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// City picker modal
// ─────────────────────────────────────────────────────────────────────────────

function CityPicker({ onSelect }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "flex-end", zIndex: 100,
      }}
    >
      <div
        style={{
          width: "100%", background: "#1a1a1e", borderRadius: "20px 20px 0 0",
          padding: "24px 20px 40px", maxHeight: "70vh", overflowY: "auto",
        }}
      >
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Choose your city</h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 20 }}>
          We'll show gyms near this city
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {CITIES.map((city) => (
            <button
              key={city.label}
              onClick={() => onSelect(city)}
              style={{
                padding: "14px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(38,38,42,1)", color: "#fff", fontSize: 15,
                fontWeight: 500, cursor: "pointer", textAlign: "left",
              }}
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
// Main Discovery screen
// ─────────────────────────────────────────────────────────────────────────────

export default function Discovery() {
  const [gyms, setGyms]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [location, setLocation]       = useState(null);     // { lat, lng, label }
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const navigate = useNavigate();

  // ── 1. Ask for location on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      setShowCityPicker(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Near you" });
      },
      () => {
        setLocationDenied(true);
        setShowCityPicker(true);
      },
      { timeout: 6000 }
    );
  }, []);

  // ── 2. Fetch gyms when location + filter changes ──────────────────────────
  const loadGyms = useCallback(async (loc, filterKey) => {
    setLoading(true);
    try {
      const filter = FILTERS.find((f) => f.apiKey === filterKey);
      const params = {
        lat:    loc?.lat,
        lng:    loc?.lng,
        sortBy: filterKey === "nearme" ? "distance" : "distance",
        ...(filter?.apiParam || {}),
      };
      const data = await fetchGyms(params);
      setGyms(data);
    } catch (err) {
      console.error("[Discovery] fetchGyms error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Don't fetch until we have a location (or user skips picker)
    if (!location) return;
    loadGyms(location, activeFilter);
  }, [location, activeFilter, loadGyms]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCitySelect = (city) => {
    setLocation({ lat: city.lat, lng: city.lng, label: city.label });
    setShowCityPicker(false);
  };

  const handleFilterClick = (key) => {
    setActiveFilter(activeFilter === key ? null : key);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-5">
      {/* City picker modal */}
      {showCityPicker && <CityPicker onSelect={handleCitySelect} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="text-xl font-semibold">Discover Gyms</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            {location
              ? `Showing gyms near ${location.label}`
              : "Finding gyms near you…"}
          </p>
        </div>
        {/* Change city button */}
        <button
          onClick={() => setShowCityPicker(true)}
          style={{
            padding: "6px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(38,38,42,1)", color: "rgba(255,255,255,0.6)", fontSize: 12,
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          📍 {location?.label || "Set city"}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.label}
            label={f.label}
            active={activeFilter === f.apiKey}
            onClick={() => handleFilterClick(f.apiKey)}
          />
        ))}
      </div>

      {/* Result count */}
      {activeFilter && !loading && (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: -8 }}>
          {gyms.length} gym{gyms.length !== 1 ? "s" : ""} ·{" "}
          <span style={{ color: "#8b5cf6", fontWeight: 600 }}>
            {FILTERS.find((f) => f.apiKey === activeFilter)?.label}
          </span>
        </p>
      )}

      {/* Gym list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : gyms.length === 0 ? (
          <EmptyState onClear={() => setActiveFilter(null)} />
        ) : (
          gyms.map((gym) => (
            <GymCard
              key={gym.id}
              gym={gym}
              onClick={() => navigate(`/gym/${gym.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 18px", borderRadius: 999,
        border: active ? "1px solid rgba(139,92,246,0.6)" : "1px solid transparent",
        background: active
          ? "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))"
          : "rgba(38,38,42,1)",
        color: active ? "#c4b5fd" : "rgb(163,163,163)",
        fontSize: 14, fontWeight: active ? 700 : 400,
        cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.18s ease",
        boxShadow: active ? "0 0 12px rgba(139,92,246,0.25)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function GymCard({ gym, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 20, background: "rgba(22,22,26,1)",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden", cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Photo */}
      <GymPhoto photoReferences={gym.photo_references} height={160} />

      <div style={{ padding: "14px 16px 16px" }}>
        {/* Name + open badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h2 style={{ fontWeight: 600, fontSize: 16 }}>{gym.name}</h2>
          {gym.open_now != null && (
            <span
              style={{
                fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                background: gym.open_now ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: gym.open_now ? "#4ade80" : "#f87171",
                whiteSpace: "nowrap",
              }}
            >
              {gym.open_now ? "Open" : "Closed"}
            </span>
          )}
        </div>

        {/* Address */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
          {gym.address}
        </p>

        {/* Rating + distance row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <StarRating rating={gym.rating} />
          {gym.user_ratings_total > 0 && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              ({gym.user_ratings_total.toLocaleString()})
            </span>
          )}
          {gym.distance_km != null && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>
              📍 {gym.distance_km < 1
                ? `${(gym.distance_km * 1000).toFixed(0)} m`
                : `${gym.distance_km.toFixed(1)} km`}
            </span>
          )}
        </div>

        {/* Tags */}
        {gym.tags && gym.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {gym.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                style={{
                  padding: "3px 10px", borderRadius: 999,
                  background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)",
                  fontSize: 11, fontWeight: 600, color: "#c4b5fd",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🏋️</span>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 20 }}>
        No gyms match this filter
      </p>
      <button
        onClick={onClear}
        style={{
          padding: "10px 24px", borderRadius: 12, border: "none", cursor: "pointer",
          background: "rgba(139,92,246,0.2)", color: "#a78bfa", fontSize: 14, fontWeight: 600,
        }}
      >
        Clear filter
      </button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 20, background: "rgba(22,22,26,1)",
      border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
    }}>
      <div style={{ height: 160, background: "rgba(38,38,42,1)" }} className="animate-pulse" />
      <div style={{ padding: "14px 16px 16px" }} className="animate-pulse space-y-2">
        <div style={{ height: 16, width: "55%", borderRadius: 6, background: "rgba(38,38,42,1)" }} />
        <div style={{ height: 12, width: "40%", borderRadius: 6, background: "rgba(38,38,42,1)" }} />
        <div style={{ height: 12, width: "30%", borderRadius: 6, background: "rgba(38,38,42,1)" }} />
      </div>
    </div>
  );
}
