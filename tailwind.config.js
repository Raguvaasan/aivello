/**
 * Aivello brand palette, derived from the logo (src/components/common/AivelloLogo.tsx).
 * Logo tile gradient = purple-600 -> pink-600 (#8139f2 -> #d4247f).
 *
 * Built in OKLCH with a fixed hue per family (violet ~294deg, pink ~350-359deg) and
 * Tailwind's lightness/chroma curve, gamut-mapped to sRGB. `purple` and `pink` are
 * overridden so every existing purple-* / pink-* class adopts the brand colours.
 *
 * Contrast (WCAG 2.x):
 *   purple-600 on #fff    5.53:1   pink-600 on #fff    4.82:1
 *   purple-400 on #111827 6.68:1   pink-400 on #111827 6.70:1
 */
const purple = {
    50: '#f6f4ff',
    100: '#edeaff',
    200: '#dfd7ff',
    300: '#c7b7ff',
    400: '#aa8cff',
    500: '#925bfe',
    600: '#8139f2',
    700: '#7027d8',
    800: '#5e21b6',
    900: '#4c1d95',
    950: '#320b68',
};

const pink = {
    50: '#fef2f7',
    100: '#fee7f0',
    200: '#fecee2',
    300: '#fda7cc',
    400: '#f771ae',
    500: '#ec4899',
    600: '#d4247f',
    700: '#ba1c6d',
    800: '#9a1959',
    900: '#811949',
    950: '#4f0829',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                purple,
                pink,
                primary: purple,
                accent: pink,
            },
            backgroundImage: {
                // Same gradient as the logo tile: `bg-brand-gradient`
                'brand-gradient': `linear-gradient(135deg, ${purple[600]} 0%, ${pink[600]} 100%)`,
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            animation: {
                'blob': 'blob 7s infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'pulse-ring': 'pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms')({
            strategy: 'class', // Only apply to elements with form-* classes
        }),
    ],
};
