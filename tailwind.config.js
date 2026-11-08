/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mirrors src/styles/tokens.css
      colors: {
        panel: "var(--panel)",
        window: "var(--window)",
        card: { DEFAULT: "var(--card)", featured: "var(--card-featured)" },
        accent: {
          DEFAULT: "var(--cyan)",
          300: "var(--cyan-300)",
          200: "var(--cyan-200)",
          600: "var(--cyan-600)",
          700: "var(--cyan-700)",
        },
        ink: {
          strong: "var(--text-strong)",
          DEFAULT: "var(--text)",
          body: "var(--text-body)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
          tag: "var(--text-tag)",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
}
