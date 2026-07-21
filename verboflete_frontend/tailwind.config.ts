/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af",
        "primary-hover": "#1e3a8a",
        secondary: "#0f2557",
        accent: "#59d2ec",
        background: "#f3f4f6",
        surface: "#ffffff",
        "text-main": "#181d38",
        "text-muted": "#6b7280",
        border: "#d1d5db",
        "menu-bg": "#181d38",
        "menu-active": "#59d2ec",
        "menu-text": "#fbfaf7",
      },
      fontFamily: {
        sans: ["Inter", "Inter Fallback", "sans-serif"],
      },
    },
  },
  plugins: [],
}