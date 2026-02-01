export default function VaultRow({ item }) {
    return (
      <div className="rounded-xl bg-neutral-900 p-4 border border-neutral-800">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{item.title}</h4>
            <p className="text-xs text-gray-500 mt-1">
              {item.category} • {item.source}
            </p>
          </div>
  
          {item.pinned && (
            <span className="text-xs text-blue-400">
              Pinned
            </span>
          )}
        </div>
      </div>
    );
  }
  