import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: [
          "Space Grotesk",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        sans: [
          "Space Grotesk",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        primary: "#020300",
        secondary: "#36311f",
        accent: "#A1E3F9",
        "primary-bg": "var(--primary-bg)",
        "secondary-bg": "var(--secondary-bg)",
        "accent-light": "var(--accent-light)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
      },
      backgroundColor: {
        primary: "var(--primary-bg)",
        secondary: "var(--secondary-bg)",
        accent: "var(--accent-light)",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
      },
      borderColor: {
        transparent: "transparent",
      },
    },
  },
  plugins: [],
};

export default config;
