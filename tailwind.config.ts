import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1E3F",
          50: "#EAF0FB",
          100: "#D0DEF5",
          200: "#A3BEEC",
          300: "#769DE2",
          400: "#4A7DD9",
          500: "#245DC9",
          600: "#1B478F",
          700: "#132F60",
          800: "#0B1E3F",
          900: "#060F22",
        },
        skyblue: {
          DEFAULT: "#1E9BD7",
          50: "#EAF7FD",
          100: "#CDECFA",
          200: "#9BD9F5",
          300: "#69C6EF",
          400: "#3BB3E9",
          500: "#1E9BD7",
          600: "#1879AA",
          700: "#125A80",
          800: "#0C3C56",
          900: "#061E2B",
        },
        diadem: {
          red: "#D6293A",
          gold: "#C9A76B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 20px 45px -15px rgba(11, 30, 63, 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
