import VaultRow from "./VaultRow";

const RECENT = [
  { title: "PPL Split.pdf", type: "Workout" },
  { title: "Blood Test – Jan.pdf", type: "Report" },
  { title: "Weekly Diet.xlsx", type: "Diet" },
];

export default function VaultRecentSection() {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Recent</h2>

      <div className="space-y-3">
        {RECENT.map((item, i) => (
          <VaultRow key={i} item={item} />
        ))}
      </div>
    </section>
  );
}
