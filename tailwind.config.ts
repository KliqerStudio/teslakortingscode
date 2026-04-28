import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#050608",
          900: "#0a0d12",
          850: "#10141b",
          800: "#141922",
          700: "#222936"
        },
        teslaRed: "#e82127",
        ember: "#ff4d55"
      },
      boxShadow: {
        glow: "0 0 50px rgba(232, 33, 39, 0.22)",
        panel: "0 22px 70px rgba(0, 0, 0, 0.36)"
      },
      backgroundImage: {
        "radial-red": "radial-gradient(circle at 50% 0%, rgba(232,33,39,0.22), rgba(232,33,39,0) 45%)",
        "glass-line": "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))"
      }
    }
  },
  plugins: []
};

export default config;
