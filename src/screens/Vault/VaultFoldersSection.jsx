import VaultFolderCard from "./VaultFolderCard";

const FOLDERS = [
  { title: "Workout Plans", count: 2 },
  { title: "Diet Plans", count: 0 },
  { title: "Progress Photos", count: 0 },
  { title: "Medical Reports", count: 2 },
];

export default function VaultFoldersSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
        Folders
      </h2>

      <div className="grid grid-cols-2 gap-6">
        {FOLDERS.map((folder) => (
          <VaultFolderCard key={folder.title} {...folder} />
        ))}
      </div>
    </section>
  );
}
