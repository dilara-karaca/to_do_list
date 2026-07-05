/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            boxShadow: {
                glow: '0 20px 80px rgba(168, 139, 250, 0.18)',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
            },
        },
    },
    plugins: [],
};