export default function IconButton({ children, active }) {
  return (
    <div
      className={`
        flex items-center justify-center
        w-10 h-10 
        rounded-xl
        transition-all duration-200
        ${active ? "scale-110 bg-white/10 shadow-[0_0_12px_rgba(56,189,248,0.5)]" : "opacity-70"}
      `}
    >
      <div
        className={`
          transition-all duration-200
          ${active ? "text-sky-400" : "text-gray-400"}
        `}
      >
        {children}
      </div>
    </div>
  );
}
