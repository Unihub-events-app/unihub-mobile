/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular"],
        sansMedium: ["PlusJakartaSans_500Medium"],
        sansSemiBold: ["PlusJakartaSans_600SemiBold"],
        sansBold: ["PlusJakartaSans_700Bold"],
        grotesk: ["SpaceGrotesk_400Regular"],
        groteskMedium: ["SpaceGrotesk_500Medium"],
        groteskSemiBold: ["SpaceGrotesk_600SemiBold"],
        groteskBold: ["SpaceGrotesk_700Bold"],
      },
      colors: {
        uniBgLight: "#f4f7fb",
        uniSurfaceLight: "#ffffff",
        uniSurfaceMutedLight: "#f8fafc",
        uniSurfaceElevatedLight: "#eef2ff",
        uniBorderLight: "#dbe3ef",
        uniBgDark: "#081018",
        uniSurfaceDark: "#0f1724",
        uniSurfaceMutedDark: "#151d2b",
        uniSurfaceElevatedDark: "#1b2536",
        uniBorderDark: "rgba(148, 163, 184, 0.12)",
        uniTextDark: "#f8fafc",
        uniTextMutedDark: "#cbd5e1",
        uniTextSubtleDark: "#94a3b8",
        uniBlue: "#3b82f6",
        uniBlueDeep: "#2563eb",
        uniBlueSoft: "#60a5fa",
        uniBlueDark: "#4b72ff",
        uniGreen: "#16a34a",
        uniAmber: "#d97706",
        uniRed: "#dc2626",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af"
        }
      }
    }
  },
  plugins: []
};
