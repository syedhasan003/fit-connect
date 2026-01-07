import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchGyms } from "../../api/discovery";

export default function Discovery() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGyms()
      .then(setGyms)
      .finally(() => setLoading(false));
  }, []);

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
      <div className="flex gap-2 overflow-x-auto">
        {["All", "Premium", "24x7", "Trainers", "Sauna"].map((f) => (
          <FilterChip key={f} label={f} />
        ))}
      </div>

      {/* Gym list */}
      <div className="space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          : gyms.map((gym) => (
              <GymCard
                key={gym.id}
                gym={gym}
                onClick={() => navigate(`/gym/${gym.id}`)}
              />
            ))}
      </div>
    </div>
  );
}

function FilterChip({ label }) {
  return (
    <div className="px-4 py-2 rounded-full bg-neutral-800 text-sm text-neutral-300 whitespace-nowrap">
      {label}
    </div>
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
      </div>
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
