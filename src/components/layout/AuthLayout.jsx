export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "40px",
        position: "relative",
        zIndex: 0
      }}
    >
      {children}
    </div>
  );
}
