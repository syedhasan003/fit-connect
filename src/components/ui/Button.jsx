export default function Button({ children, className = "", ...props }) {
    return (
      <button
        {...props}
        className={
          "px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-[0.99] shadow-lg text-black font-medium " +
          className
        }
      >
        {children}
      </button>
    );
  }
  