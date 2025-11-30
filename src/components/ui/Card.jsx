export default function Card({ children, className = "" }) {
    return (
      <div className={"bg-neutral-800 rounded-2xl p-4 shadow-md border border-neutral-700 " + className}>
        {children}
      </div>
    );
  }
  