import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        white: "var(--card)",
        black: "var(--bg-base)",
        gray: {
          50: "var(--surface)",
          100: "var(--surface)",
          200: "var(--surface)",
          300: "var(--border)",
          400: "var(--text-muted)",
          500: "var(--text-muted)",
          600: "var(--border)",
          700: "var(--surface)",
          800: "var(--surface)",
          900: "var(--card)",
          950: "var(--card)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
