export default function VaultPinnedTile({
  title,
  subtitle,
  meta,
  locked,
}) {
  return (
    <div
      className="
        group
        rounded-2xl
        border border-neutral-800
        bg-neutral-950
        p-6
        transition
        hover:border-neutral-600
        hover:bg-neutral-900
        cursor-pointer
      "
    >
      {/* TOP */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            {title}
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            {subtitle}
          </p>
        </div>

        {locked && (
          <span className="text-xs text-neutral-500">
            🔒
          </span>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-6 text-xs text-neutral-500">
        {meta}
      </div>
    </div>
  );
}
