import VaultPinnedSection from "./VaultPinnedSection";

export default function Vault() {
  return (
    <div className="min-h-screen bg-black text-white px-8 py-8">
      {/* HEADER */}
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Vault</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Your personal fitness library
        </p>
      </header>

      {/* PINNED */}
      <VaultPinnedSection />
    </div>
  );
}
