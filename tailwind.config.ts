import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0b0d12",
          panel: "#12151c",
          card: "#171b24",
          border: "#242a36",
        },
        espresso: "#0C0A08",
        ivory: "#F6F1E9",
        gold: "#C8914A",
        taupe: "#6B5B4E",
        "dark-card": "#1A1612",
        "dark-input": "#2C2520",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "ticket-in": {
          "0%": { opacity: "0", transform: "translateY(-8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(52, 211, 153, 0.5)" },
          "100%": { boxShadow: "0 0 0 6px rgba(52, 211, 153, 0)" },
        },
      },
      animation: {
        "ticket-in": "ticket-in 0.35s ease-out",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
