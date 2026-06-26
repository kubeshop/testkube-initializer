/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // app.testkube.io — src/styles/Colors.ts + antdThemeConfig.ts
      colors: {
        tk: {
          bg: "#111827",
          surface: "#141414",
          panel: "#0f172a",
          border: "#1e293b",
          primary: "#7984f4",
          "primary-hover": "#a8b2ff",
          "primary-active": "#5d63cf",
          accent: "#818cf8",
          link: "#7984f4",
          muted: "#94a3b8",
          subtle: "#64748b",
          disabled: "#475569",
          text: "#e2e8f0",
          heading: "#ffffff",
          error: "#ec4899",
          warning: "#f59e0b",
          success: "#a3e635",
          yellow: "#facc15",
          slate: {
            50: "#f8fafc",
            200: "#e2e8f0",
            300: "#cbd5e1",
            400: "#94a3b8",
            500: "#64748b",
            600: "#475569",
            700: "#334155",
            800: "#1e293b",
            900: "#0f172a",
          },
        },
      },
      fontFamily: {
        sans: ["Roboto", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: ["14px", { lineHeight: "1.5715" }],
      },
      borderRadius: {
        tk: "4px",
        "tk-md": "4px",
      },
      boxShadow: {
        panel: "none",
      },
    },
  },
  plugins: [],
};
