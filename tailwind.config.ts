import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#06080c",
        panel: "#10141c",
        line: "#232a36",
        mist: "#a9b3c4",
        paper: "#f5f7fb",
        accent: "#69e0d2"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(105, 224, 210, 0.18), 0 20px 70px rgba(0, 0, 0, 0.32)"
      }
    }
  },
  plugins: []
};

export default config;
