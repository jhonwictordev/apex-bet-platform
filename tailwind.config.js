/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#080B11",
          darkest: "#080B11",
          surface: "#10151E",
          surfaceElevated: "#19212D",
          surfaceHighlight: "#242F3E",
          card: "#131924",
          cardHover: "#1C2433",
          border: "rgba(255, 255, 255, 0.08)",
          borderAccent: "rgba(184, 255, 50, 0.35)",
          accent: "#B8FF32",
          accentHover: "#C9FF5C",
          accentSecondary: "#6DFFBE",
          accentMuted: "rgba(184, 255, 50, 0.12)",
          textPrimary: "#F5F7FA",
          textSecondary: "#8F9BAA",
          textMuted: "#5C6777",
          danger: "#FF4D4F",
          warning: "#FAAD14",
          success: "#52C41A",
          info: "#38BDF8",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Space Grotesk",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px rgba(184, 255, 50, 0.28)",
        glowSm: "0 0 12px rgba(184, 255, 50, 0.2)",
        glowCyan: "0 0 20px rgba(109, 255, 190, 0.25)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.6)",
        cardHover: "0 20px 40px -15px rgba(0, 0, 0, 0.8)",
        innerGlow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)",
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ticker-live": "ticker-live 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite linear",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.65 },
        },
        "ticker-live": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.4, transform: "scale(0.85)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
