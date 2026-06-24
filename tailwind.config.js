/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Brand palette from https://testkube.io (Webflow design tokens)
      colors: {
        tk: {
          ink: "#0b0618",
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
        panel: "0 8px 32px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "tk-glow":
          "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(81, 48, 196, 0.42), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(241, 172, 252, 0.12), transparent 50%)",
      },
    },
  },
  plugins: [],
};
