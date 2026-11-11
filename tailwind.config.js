/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,css}"],
  theme: {
    extend: {
      colors: {
        // Corti design language (extracted from corti.ai production CSS, dark theme)
        corti: {
          "bg-primary": "#08090a",
          "bg-dark": "#030303",
          "bg-secondary": "#1a1a1a",
          "bg-tertiary": "#242424",
          "bg-card": "#141414",
          "border-dark": "#292929",
          "border-tree": "#3b3e43",
          "border-faint": "#292b2e",
          "border-strong": "rgba(255,255,255,0.26)",
          accent: "#b8f818",
          "text-primary": "#fafafa",
          "text-secondary": "#c1c1c1",
          "text-tertiary": "#868686",
          success: "#166534",
          "success-light": "#dcfce7",
          error: "#991b1b",
          "error-light": "#fee2e2",
          "grid-line": "#ffffff08",
          "grid-line-accent": "#fd3db50a",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "Arial", "sans-serif"],
        sans: ["Booton", "Arial", "sans-serif"],
        pixel: ["Press Start 2P", "monospace"],
        tag: ["Silkscreen", "IBM Plex Mono", "ui-monospace", "monospace"],
        body: ["Booton", "Arial", "sans-serif"],
      },
      fontWeight: {
        heading: "550",
      },
      letterSpacing: {
        heading: "-0.03em",
        mono: "0.04em",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      maxWidth: {
        page: "80rem",
      },
    },
  },
  plugins: [],
};
