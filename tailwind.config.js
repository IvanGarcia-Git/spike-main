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
        // Primary brand colors
        primary: "#14b8a6", // teal-500
        "primary-dark": "#0f766e", // teal-700
        "primary-light": "#5eead4", // teal-300

        // Background colors
        "background-light": "#F0F2F5",
        "background-dark": "#1a1c23",
        "card-dark": "#2E3039",

        // Divider and border colors
        "divider-light": "#E2E4E7",
        "divider-dark": "#252830",

        // Text colors
        "text-primary-light": "#1f2937", // gray-800
        "text-secondary-light": "#6b7280", // gray-500
        "text-primary-dark": "#f9fafb", // gray-50
        "text-secondary-dark": "#9ca3af", // gray-400

        // Status colors
        success: "#10b981", // green-500
        warning: "#f59e0b", // amber-500
        danger: "#ef4444", // red-500
        info: "#3b82f6", // blue-500

        // Existing colors (preserve compatibility)
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
        sans: ["Poppins", "sans-serif"],
      },
      fontSize: {
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px
        'base': '1rem',      // 16px
        'lg': '1.125rem',    // 18px
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px
        '3xl': '1.875rem',   // 30px
        '4xl': '2.25rem',    // 36px
        '5xl': '3rem',       // 48px
      },
      borderRadius: {
        DEFAULT: "1rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "2rem",
        full: "9999px",
      },
      boxShadow: {
        // Main neumorphic shadows
        'neumorphic-light': '3px 3px 6px #d9dbde, -3px -3px 6px #ffffff',
        'neumorphic-dark': '3px 3px 6px #15171c, -3px -3px 6px #1f212a',
        'neumorphic-inset-light': 'inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff',
        'neumorphic-inset-dark': 'inset 2px 2px 4px #15171c, inset -2px -2px 4px #1f212a',

        // Subtle variations
        'neumorphic-light-sm': '2px 2px 4px #d9dbde, -2px -2px 4px #ffffff',
        'neumorphic-dark-sm': '2px 2px 4px #15171c, -2px -2px 4px #1f212a',
        'neumorphic-light-lg': '5px 5px 10px #d9dbde, -5px -5px 10px #ffffff',
        'neumorphic-dark-lg': '5px 5px 10px #15171c, -5px -5px 10px #1f212a',

        // Hover states (slightly elevated)
        'neumorphic-light-hover': '4px 4px 8px #d9dbde, -4px -4px 8px #ffffff',
        'neumorphic-dark-hover': '4px 4px 8px #15171c, -4px -4px 8px #1f212a',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
