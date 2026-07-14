import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAFA",
        ink: "#111111",
        muted: "#666666",
        line: "#E5E5E5",
        accent: "#2563EB",
      },
      boxShadow: {
        portrait: "0 24px 50px -28px rgba(17, 17, 17, 0.42)",
        card: "0 16px 40px -24px rgba(17, 17, 17, 0.28)",
      },
    },
  },
  plugins: [],
} satisfies Config;
