/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#070A12",       // app background
          surface: "#0C111D",    // cards
          elevated: "#11172A",   // hover / elevated
        },
        line: {
          subtle: "#1A2138",
          DEFAULT: "#252D45",
          strong: "#38425F",
        },
        ink: {
          1: "#F0F4FF",          // primary text
          2: "#A5AFC8",          // secondary
          3: "#5F6A85",          // tertiary
          4: "#3A4360",          // disabled
        },
        accent: {
          cyan: "#00D9FF",
          amber: "#FFB020",
          red: "#FF4757",
          green: "#00E676",
          violet: "#A78BFA",
          pink: "#F472B6",
        },
        verdict: {
          safe: "#00E676",
          caution: "#FFB020",
          warning: "#FF8C42",
          block: "#FF4757",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      animation: {
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan-line 4s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "grid-fade": "grid-fade 8s ease-in-out infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "grid-fade": {
          "0%, 100%": { opacity: "0.05" },
          "50%": { opacity: "0.12" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(37, 45, 69, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 45, 69, 0.4) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
    },
  },
  plugins: [],
};
