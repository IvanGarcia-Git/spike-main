/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        backgroundHover: "var(--background-hover)",
        backgroundHoverBold: "var(--background-hover-bold)",
        foreground: "var(--foreground)",
        secondary: "var(--secondary)",
        secondaryHover: "var(--secondary-hover)",
        
      },
    },
  },
  plugins: [],
};
