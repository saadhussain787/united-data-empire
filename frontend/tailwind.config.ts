// FILE: frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#DA291C", // Primary Action Red (live pulse/badges)
          crimson: "#7A0006", // Heritage Crimson (headers/accents)
          gold: "#D4AF37", // Legend Gold (historical card accents/numbers)
          carbon: "#0B0E14", // Deep Carbon (dark mode background)
          slate: "#151A22", // Slate Surface (card background)
          border: "#232A36", // Slate Border
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "pulse-live": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;