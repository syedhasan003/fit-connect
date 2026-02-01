import VaultRow from "./VaultRow";

export default function VaultItemList({ items }) {
  if (!items.length) {
    return (
      <div className="text-sm text-gray-500">
        No items yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <VaultRow key={item.id} item={item} />
      ))}
    </div>
  );
}
