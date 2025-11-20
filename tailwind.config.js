/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'primary': 'rgb(var(--color-primary) / <alpha-value>)',
                'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
                'accent': 'rgb(var(--color-accent) / <alpha-value>)',
                'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
                'surface': 'rgb(var(--color-surface) / <alpha-value>)',
                'background': 'rgb(var(--color-background) / <alpha-value>)',
                'text-main': 'rgb(var(--color-text-main) / <alpha-value>)',
                'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
                'danger': {
                    DEFAULT: '#dc2626', // red-600
                    light: '#fef2f2', // red-50
                    text: '#991b1b', // red-800
                    border: '#fca5a5' // red-300
                },
                'info': {
                    DEFAULT: '#3b82f6', // blue-500
                    light: '#eff6ff', // blue-50
                    text: '#1e40af', // blue-800
                    border: '#93c5fd' // blue-300
                },
                'warning': {
                    DEFAULT: '#f59e0b', // amber-500
                    light: '#fffbeb', // amber-50
                    text: '#b45309', // amber-800
                    border: '#fcd34d' // amber-300
                },
                'success': {
                    DEFAULT: '#16a34a', // green-600
                    light: '#f0fdf4', // green-50
                    text: '#14532d', // green-900
                    border: '#86efac' // green-300
                },
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up-fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'pulse-bg-critical': {
                    '0%, 100%': { backgroundColor: 'var(--tw-colors-danger-light)' },
                    '50%': { backgroundColor: '#fee2e2' }, // red-100
                },
            },
            animation: {
                'fade-in': 'fade-in 0.5s ease-in-out',
                'slide-up-fade-in': 'slide-up-fade-in 0.3s ease-out',
                'pulse-bg-critical': 'pulse-bg-critical 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}
