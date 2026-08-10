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
          bg: "#F3F0E9",
          panel: "#FBFAF7",
          card: "#FFFFFF",
          border: "#DDD5C8",
        },
        espresso: "#F3F0E9",
        ivory: "#1F2A37",
        gold: "#A8752B",
        taupe: "#74695E",
        "dark-card": "#FFFFFF",
        "dark-input": "#EFE9DF",
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
          "0%": { boxShadow: "0 0 0 0 rgba(16, 120, 87, 0.35)" },
          "100%": { boxShadow: "0 0 0 6px rgba(16, 120, 87, 0)" },
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
