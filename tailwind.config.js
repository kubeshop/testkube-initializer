/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Official Webflow swatches from testkube.io shared CSS
      colors: {
        tk: {
          ink: "#160f31",
          surface: "#252348",
          sidebar: "#1c1a36",
          purple: {
            900: "#160f31",
            800: "#252348",
            700: "#1c1a36",
            600: "#412f7e",
            500: "#5130c4",
            400: "#5048e4",
            300: "#818cf8",
            200: "#cfc8fd",
            100: "#e8e5ff",
          },
          pink: "#f1acfc",
          yellow: "#ffdb5b",
          gray: "#f4f4f4",
          success: "#4c9d34",
          warning: "#fe8240",
          error: "#e33c44",
        },
      },
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        tk: "1.25rem",
        "tk-md": "0.625rem",
        pill: "9999px",
      },
      boxShadow: {
        tk: "0 20px 60px -20px rgba(81, 48, 196, 0.45)",
        glow: "0 0 120px rgba(81, 48, 196, 0.35)",
        panel: "0 8px 32px rgba(0, 0, 0, 0.28)",
        "card-featured": "0 0 0 1px rgba(129, 140, 248, 0.35), 0 16px 48px rgba(81, 48, 196, 0.22)",
      },
    },
  },
  plugins: [],
};
