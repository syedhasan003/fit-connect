import VaultPinnedTile from "./VaultPinnedTile";

const PINNED_ITEMS = [
  {
    title: "Central",
    subtitle: "AI-generated answers",
    meta: "Tap to open",
    locked: false,
  },
  {
    title: "Workout Plans",
    subtitle: "Manual & applied",
    meta: "Locked",
    locked: true,
  },
  {
    title: "Diet Plans",
    subtitle: "Active diets",
    meta: "Tap to open",
    locked: false,
  },
  {
    title: "Health Memory",
    subtitle: "Immutable timeline",
    meta: "Read-only",
    locked: true,
  },
  {
    title: "Health Records",
    subtitle: "Reports & tests",
    meta: "Tap to open",
    locked: false,
  },
];

export default function VaultPinnedSection() {
  return (
    <section className="space-y-5">
      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold text-white">Pinned</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Core health sources
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-6">
        {PINNED_ITEMS.map((item) => (
          <VaultPinnedTile key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}
