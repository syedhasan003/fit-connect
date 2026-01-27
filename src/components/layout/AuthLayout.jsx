export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #111 0%, #000 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 16,
          padding: "32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
