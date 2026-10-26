import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1FCB77", dark: "#126F5A", deep: "#0E5A49", tint: "#E8F7EE" },
        ink: "#0F172A",
        muted: "#5B6B7F",
        surface: "#F3F5F8",
        line: "#E4E9F0",
        night: "#0B1120",
        mint: "#CFEBD6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 32px -14px rgba(15,23,42,0.18)",
        glow: "0 12px 26px -10px rgba(18,111,90,0.55)",
        nav: "0 -8px 30px -12px rgba(15,23,42,0.22)",
      },
      borderRadius: { "4xl": "2rem" },
    },
  },
  plugins: [],
};

export default config;
