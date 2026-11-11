/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          bg: "#F8FCFF",
          primary: "#2196F3",
          secondary: "#64B5F6",
          light: "#E3F2FD",
          card: "#FFFFFF",
          border: "#DCEEFF",
          success: "#2ECC71",
          warning: "#F39C12",
          danger: "#E74C3C",
          textPrimary: "#1F2937",
          textSecondary: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        xl2: "16px",
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(33,150,243,0.07), 0 1px 4px 0 rgba(0,0,0,0.04)",
        "card-hover": "0 8px 32px 0 rgba(33,150,243,0.13), 0 2px 8px 0 rgba(0,0,0,0.06)",
        kpi: "0 4px 24px 0 rgba(33,150,243,0.10)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in": "fadeIn 0.4s ease",
        "slide-up": "slideUp 0.4s ease",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
