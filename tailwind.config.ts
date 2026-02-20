import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ua: {
          red: "#AB0520",
          blue: "#0C234B",
          midnight: "#001C48",
          azurite: "#1E5288",
          oasis: "#378DBD",
          chili: "#8B0015",
          bloom: "#EF4056",
          sky: "#81D3EB",
          leaf: "#70B865",
          river: "#007D84",
          mesa: "#A95C42",
          "warm-gray": "#F4EDE5",
          "cool-gray": "#E2E9EB",
        },
      },
    },
  },
  plugins: [],
};
export default config;
