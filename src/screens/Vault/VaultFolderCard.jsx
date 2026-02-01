export default function VaultFolderCard({ title, count }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 hover:bg-neutral-800 transition cursor-pointer">
      <p className="text-base font-medium">{title}</p>
      <p className="text-sm text-neutral-400 mt-2">
        {count} files
      </p>
    </div>
  );
}
