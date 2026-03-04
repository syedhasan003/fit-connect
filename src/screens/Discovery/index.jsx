import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGyms } from "../../api/discovery";

const FILTERS = [
  { label: "All",      key: null },
  { label: "Premium",  key: "premium" },
  { label: "24x7",     key: "24x7" },
  { label: "Trainers", key: "trainers" },
  { label: "Sauna",    key: "sauna" },
];

// Match a gym against the active filter key.
// Checks gym.tags, gym.amenities, gym.features, and gym.name — graceful fallback.
function gymMatchesFilter(gym, filterKey) {
  if (!filterKey) return true;
  const haystack = [
    ...(gym.tags        || []),
    ...(gym.amenities   || []),
    ...(gym.features    || []),
    gym.type || "",
    gym.name || "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(filterKey.toLowerCase());
}

export default function Discovery() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null); // null = "All"
  const navigate = useNavigate();

  useEffect(() => {
    fetchGyms()
      .then(setGyms)
      .finally(() => setLoading(false));
  }, []);

  const visible = gyms.filter((g) => gymMatchesFilter(g, activeFilter));

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Discover Gyms</h1>
        <p className="text-sm text-neutral-400">
          Handpicked gyms near you
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.label}
            label={f.label}
            active={activeFilter === f.key}
            onClick={() => setActiveFilter(activeFilter === f.key ? null : f.key)}
          />
        ))}
      </div>

      {/* Result count when filtered */}
      {activeFilter && !loading && (
        <p style={{ margin: "-12px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          {visible.length} gym{visible.length !== 1 ? "s" : ""} with{" "}
          <span style={{ color: "#8b5cf6", fontWeight: 600 }}>
            {FILTERS.find((f) => f.key === activeFilter)?.label}
          </span>
        </p>
      )}

      {/* Gym list */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : visible.length === 0 ? (
          <EmptyFilter onClear={() => setActiveFilter(null)} />
        ) : (
          visible.map((gym) => (
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

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 18px",
        borderRadius: 999,
        border: active ? "1px solid rgba(139,92,246,0.6)" : "1px solid transparent",
        background: active
          ? "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))"
          : "rgba(38,38,42,1)",
        color: active ? "#c4b5fd" : "rgb(163,163,163)",
        fontSize: 14,
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.18s ease",
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
      className="rounded-2xl bg-neutral-900 p-4 space-y-3 cursor-pointer hover:bg-neutral-800 transition"
    >
      <div className="h-40 rounded-xl bg-neutral-800" />
      <div>
        <h2 className="font-medium">{gym.name}</h2>
        <p className="text-sm text-neutral-400">{gym.address}</p>
        {gym.tags && gym.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
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

function EmptyFilter({ onClear }) {
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
    <div className="rounded-2xl bg-neutral-900 p-4 space-y-3 animate-pulse">
      <div className="h-40 rounded-xl bg-neutral-800" />
      <div className="h-4 w-1/2 bg-neutral-800 rounded" />
      <div className="h-3 w-1/3 bg-neutral-800 rounded" />
    </div>
  );
}
