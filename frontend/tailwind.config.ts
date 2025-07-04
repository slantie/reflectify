import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    "Inter",
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    '"Segoe UI"',
                    "Roboto",
                    '"Helvetica Neue"',
                    "Arial",
                    '"Noto Sans"',
                    "sans-serif",
                    '"Apple Color Emoji"',
                    '"Segoe UI Emoji"',
                    '"Segoe UI Symbol"',
                    '"Noto Color Emoji"',
                ],
            },
            colors: {
                primary: {
                    main: "#f97316", // Primary orange
                    light: "#fb923c", // Lighter orange
                    lighter: "#fff7ed", // Soft background
                    dark: "#ea580c", // Darker primary
                    darker: "#c2410c", // Even darker for contrast
                },

                secondary: {
                    lighter: "#f9fafb", // gray-50
                    light: "#e5e7eb", // gray-200
                    main: "#9ca3af", // gray-400
                    dark: "#4b5563", // gray-600
                    darker: "#1f2937", // gray-800
                },

                positive: {
                    lighter: "#f0fdf4", // green-50
                    light: "#bbf7d0", // green-200
                    main: "#22c55e", // green-500
                    dark: "#15803d", // green-700
                    darker: "#14532d", // green-900
                },

                warning: {
                    lighter: "#fffbeb", // yellow-50
                    light: "#fef08a", // yellow-200
                    main: "#eab308", // yellow-500
                    dark: "#ca8a04", // yellow-600
                    darker: "#854d0e", // yellow-900
                },

                negative: {
                    lighter: "#fef2f2", // red-50
                    light: "#fecaca", // red-200
                    main: "#ef4444", // red-500
                    dark: "#dc2626", // red-600
                    darker: "#7f1d1d", // red-900
                },

                highlight1:{ // blue
                    lighter: "#dbeafe", // blue-50
                    light: "#bfdbfe", // blue-200
                    main: "#60a5fa", // blue-500
                    dark: "#2563eb", // blue-600
                    darker: "#1d4ed8", // blue-900
                },

                highlight2:{ // purple
                    lighter: "#f3e8ff", // purple-50
                    light: "#e9d5ff", // purple-200
                    main: "#c084f1", // purple-500
                    dark: "#a855f7", // purple-600
                    darker: "#9333ea", // purple-900
                },

                dark: {
                    text: "#DFDFD6",
                    background: "#1B1B1F",
                    highlight: "#f97316", // primary main for highlight
                    muted: {
                        text: "#FFFFFF",
                        background: "#202127",
                    },
                    noisy: {
                        text: "#98989F",
                        background: "#161618",
                    },
                    hover: "#414853",
                    secondary: "#32363F",
                    tertiary: "#98989F",
                },

                light: {
                    text: "#3C3C43",
                    background: "#FFFFFF",
                    highlight: "#f97316", // primary main for highlight
                    muted: {
                        text: "#67676C",
                        background: "#F6F6F7",
                    },
                    noisy: {
                        text: "#67676C",
                        background: "#C2C2C4",
                    },
                    hover: "#E4E4E9",
                    secondary: "#EBEBEF",
                    tertiary: "#98989F",
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
