export default function AOrb({ size = "medium" }) {
  const orbSize =
    size === "large" ? "w-20 h-20" : size === "small" ? "w-10 h-10" : "w-14 h-14";

  return (
    <div
      className={`
        ${orbSize}
        rounded-full
        bg-gradient-to-br from-indigo-400 to-sky-500
        shadow-[0_0_25px_rgba(56,189,248,0.6)]
        animate-orb-float
        transition-all duration-300
        hover:scale-[1.08]
        active:scale-[0.95]
      `}
    />
  );
}
