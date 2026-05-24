/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        surface: "#111827",
        primary: {
          DEFAULT: "#10b981",
          foreground: "#020617",
        },
        secondary: {
          DEFAULT: "#3b82f6",
          foreground: "#f8fafc",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      keyframes: {
        pulseMarker: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.08)", opacity: "0.9" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        truckDrive: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        radarRing: {
          "0%": { transform: "scale(0.65)", opacity: "0.85" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
      },
      animation: {
        pulseMarker: "pulseMarker 1.75s ease-in-out infinite",
        slideIn: "slideIn 0.35s ease-out",
        "truck-drive": "truckDrive 0.8s ease-in-out infinite",
        "radar-ring": "radarRing 1.6s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
