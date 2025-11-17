/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#14b8a6", // teal-500
        "background-light": "#F0F2F5",
        "background-dark": "#1a1c23",
        background: "var(--background)",
        backgroundHover: "var(--background-hover)",
        backgroundHoverBold: "var(--background-hover-bold)",
        foreground: "var(--foreground)",
        secondary: "var(--secondary)",
        secondaryHover: "var(--secondary-hover)",
        border: "hsl(var(--border, 214.3 31.8% 91.4%))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "1.25rem",
        xl: "1.5rem",
      },
      boxShadow: {
        'neumorphic-light': '3px 3px 6px #d9dbde, -3px -3px 6px #ffffff',
        'neumorphic-dark': '3px 3px 6px #15171c, -3px -3px 6px #1f212a',
        'neumorphic-inset-light': 'inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff',
        'neumorphic-inset-dark': 'inset 2px 2px 4px #15171c, inset -2px -2px 4px #1f212a',
      }
    },
  },
  plugins: [],
};
