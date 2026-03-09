import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchGymDetail, fetchGymPhotoBlob } from "../../api/discovery";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function useUserLocation() {
  const [location, setLocation] = useState(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);
  return location;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero photo (full-width, fetched via auth proxy)
// ─────────────────────────────────────────────────────────────────────────────

function HeroPhoto({ photoReferences = [] }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const ref = photoReferences[0];
    if (!ref) return;
    fetchGymPhotoBlob(ref, 800).then((url) => {
      if (mounted.current && url) setBlobUrl(url);
    });
    return () => {
      mounted.current = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoReferences[0]]);

  if (blobUrl) {
    return (
      <div style={{ height: 240, position: "relative", overflow: "hidden" }}>
        <img
          src={blobUrl}
          alt="gym hero"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Gradient overlay for readability */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height: 240,
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Amenity chip
// ─────────────────────────────────────────────────────────────────────────────

function AmenityChip({ label, icon }) {
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 999,
        background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
        fontSize: 12, fontWeight: 600, color: "#c4b5fd",
      }}
    >
      <span>{icon}</span> {label}
    </div>
  );
}

const AMENITY_MAP = [
  { key: "is_24_7",      label: "24x7",     icon: "🕐" },
  { key: "is_premium",   label: "Premium",  icon: "⭐" },
  { key: "has_trainers", label: "Trainers", icon: "💪" },
  { key: "has_sauna",    label: "Sauna",    icon: "🧖" },
  { key: "has_pool",     label: "Pool",     icon: "🏊" },
  { key: "has_parking",  label: "Parking",  icon: "🅿️" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Opening hours component
// ─────────────────────────────────────────────────────────────────────────────

function OpeningHours({ hours }) {
  const [expanded, setExpanded] = useState(false);
  if (!hours || !hours.weekday_text || hours.weekday_text.length === 0) return null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayLine = hours.weekday_text.find((t) => t.startsWith(today));

  return (
    <div
      style={{
        background: "rgba(22,22,26,1)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "14px 16px",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>
            {hours.open_now != null
              ? hours.open_now
                ? <span style={{ color: "#4ade80" }}>● Open now</span>
                : <span style={{ color: "#f87171" }}>● Closed</span>
              : "Hours"}
          </p>
          {!expanded && todayLine && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              {todayLine}
            </p>
          )}
        </div>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          {hours.weekday_text.map((line, i) => {
            const isToday = line.startsWith(today);
            return (
              <p
                key={i}
                style={{
                  fontSize: 13, marginBottom: 6,
                  color: isToday ? "#e2e8f0" : "rgba(255,255,255,0.45)",
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {line}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main GymDetail screen
// ─────────────────────────────────────────────────────────────────────────────

export default function GymDetail() {
  const { gymId } = useParams();
  const navigate  = useNavigate();
  const location  = useUserLocation();

  const [gym, setGym]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!gymId) return;
    fetchGymDetail(gymId, location?.lat, location?.lng)
      .then(setGym)
      .catch((err) => {
        console.error("[GymDetail] fetch error:", err);
        setError("Could not load gym details.");
      })
      .finally(() => setLoading(false));
  }, [gymId, location]);

  if (loading) return <GymDetailSkeleton />;
  if (error)   return <ErrorState message={error} onBack={() => navigate(-1)} />;
  if (!gym)    return null;

  const activeAmenities = AMENITY_MAP.filter((a) => gym[a.key]);

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute", top: 16, left: 16, zIndex: 10,
          background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 999,
          width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        ‹
      </button>

      {/* Hero photo */}
      <HeroPhoto photoReferences={gym.photo_references} />

      <div style={{ padding: "0 16px", marginTop: -24 }}>

        {/* Header card */}
        <div
          style={{
            borderRadius: 20, background: "rgba(22,22,26,1)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "18px 18px 16px", marginBottom: 16,
          }}
        >
          {/* Name + open badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{gym.name}</h1>
            {gym.open_now != null && (
              <span
                style={{
                  fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                  background: gym.open_now ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: gym.open_now ? "#4ade80" : "#f87171",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {gym.open_now ? "Open Now" : "Closed"}
              </span>
            )}
          </div>

          {/* Address */}
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            📍 {gym.address || "Address unavailable"}
          </p>

          {/* Rating + distance + reviews row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            {gym.rating && (
              <>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {/* Star bar */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < Math.round(gym.rating) ? "#facc15" : "rgba(255,255,255,0.2)", fontSize: 14 }}>
                      ★
                    </span>
                  ))}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginLeft: 2 }}>
                    {gym.rating.toFixed(1)}
                  </span>
                </span>
                {gym.user_ratings_total > 0 && (
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    {gym.user_ratings_total.toLocaleString()} reviews
                  </span>
                )}
              </>
            )}
            {gym.distance_km != null && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginLeft: "auto" }}>
                {gym.distance_km < 1
                  ? `${(gym.distance_km * 1000).toFixed(0)} m away`
                  : `${gym.distance_km.toFixed(1)} km away`}
              </span>
            )}
          </div>

          {/* Amenity chips */}
          {activeAmenities.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {activeAmenities.map((a) => (
                <AmenityChip key={a.key} label={a.label} icon={a.icon} />
              ))}
            </div>
          )}
        </div>

        {/* About */}
        {gym.description && (
          <section style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>About</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
              {gym.description}
            </p>
          </section>
        )}

        {/* Opening hours */}
        {gym.opening_hours && Object.keys(gym.opening_hours).length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Hours</h2>
            <OpeningHours hours={gym.opening_hours} />
          </section>
        )}

        {/* Contact */}
        {(gym.phone_number || gym.website) && (
          <section style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Contact</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {gym.phone_number && (
                <a
                  href={`tel:${gym.phone_number}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", borderRadius: 16,
                    background: "rgba(22,22,26,1)", border: "1px solid rgba(255,255,255,0.07)",
                    color: "#e2e8f0", textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: 20 }}>📞</span>
                  <div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Phone</p>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>{gym.phone_number}</p>
                  </div>
                  <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: 16 }}>›</span>
                </a>
              )}
              {gym.website && (
                <a
                  href={gym.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", borderRadius: 16,
                    background: "rgba(22,22,26,1)", border: "1px solid rgba(255,255,255,0.07)",
                    color: "#e2e8f0", textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: 20 }}>🌐</span>
                  <div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Website</p>
                    <p
                      style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}
                    >
                      {gym.website.replace(/^https?:\/\/(www\.)?/, "")}
                    </p>
                  </div>
                  <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: 16 }}>›</span>
                </a>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Fixed CTA */}
      <div
        style={{
          position: "fixed", bottom: 64, left: 0, right: 0, padding: "0 16px",
          background: "linear-gradient(to top, rgba(10,10,14,1) 70%, transparent)",
          paddingTop: 20,
        }}
      >
        <button
          style={{
            width: "100%", padding: "16px 0", borderRadius: 18, border: "none",
            cursor: "pointer", fontSize: 16, fontWeight: 700,
            background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(139,92,246,0.4)",
          }}
        >
          Enquire Membership
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton + Error states
// ─────────────────────────────────────────────────────────────────────────────

function GymDetailSkeleton() {
  return (
    <div style={{ paddingBottom: 100 }} className="animate-pulse">
      <div style={{ height: 240, background: "rgba(38,38,42,1)" }} />
      <div style={{ padding: "16px" }}>
        <div style={{ height: 28, width: "60%", background: "rgba(38,38,42,1)", borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 16, width: "80%", background: "rgba(38,38,42,1)", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 16, width: "40%", background: "rgba(38,38,42,1)", borderRadius: 6 }} />
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{message}</p>
      <button
        onClick={onBack}
        style={{
          padding: "10px 24px", borderRadius: 12, border: "none", cursor: "pointer",
          background: "rgba(139,92,246,0.2)", color: "#a78bfa", fontWeight: 600,
        }}
      >
        Go back
      </button>
    </div>
  );
}
