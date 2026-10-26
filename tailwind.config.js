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
          darkest: "#0B0E14",
          surface: "#151A23",
          card: "#1D2430",
          cardHover: "#242D3C",
          border: "#283244",
          accent: "#B4FF39",
          accentHover: "#9EE628",
          accentMuted: "rgba(180, 255, 57, 0.15)",
          textPrimary: "#FFFFFF",
          textSecondary: "#A5ADBA",
          textMuted: "#6B7280",
          danger: "#FF4D4F",
          warning: "#FAAD14",
          success: "#52C41A",
          info: "#1890FF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(180, 255, 57, 0.25)",
        glowSm: "0 0 10px rgba(180, 255, 57, 0.2)",
      },
    },
  },
  plugins: [],
};
