export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0a0a0a",
          800: "#111111",
          700: "#1a1a1a",
          card: "#161616",
        },
        primary: {
          500: "#6C63FF",
          600: "#5A52E0",
          700: "#453ECC",
        },
      },
      borderRadius: {
        soft: "14px",
        full: "999px",
      },
      boxShadow: {
        subtle: "0 2px 10px rgba(255,255,255,0.05)",
        card: "0 4px 20px rgba(0,0,0,0.4)",
        glow: "0 0 30px rgba(108,99,255,0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
