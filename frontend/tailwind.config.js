/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0b1220",
          900: "#0f172a",
          700: "#334155",
          500: "#64748b",
          400: "#94a3b8",
        },
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#1d4ed8",
          600: "#1e40af",
          700: "#1e3a8a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.05), 0 8px 24px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
