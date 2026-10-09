/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Noto Sans Malayalam",
          "sans-serif",
        ],
        malayalam: ["Noto Sans Malayalam", "sans-serif"],
      },
    },
  },
  plugins: [],
};
