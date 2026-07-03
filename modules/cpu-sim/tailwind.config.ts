import type { Config } from "tailwindcss";

// Isolated Tailwind setup — this module doesn't share config with the outer
// xshow project on purpose (different palette, different design constraints).
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        // Terminal-inspired palette: warm amber accents on cold slate panels.
        panel: "#0f172a",       // slate-900
        panelAlt: "#1e293b",    // slate-800
        border: "#334155",      // slate-700
        accent: "#f59e0b",      // amber-500
        accentDim: "#b45309",   // amber-700
        good: "#22c55e",        // green-500
        bad: "#ef4444",         // red-500
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
