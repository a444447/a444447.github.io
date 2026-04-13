/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF9F5',
        ink: { DEFAULT: '#1F1F1C', muted: '#7A7A72', faint: '#C8C7C0' },
        accent: { DEFAULT: '#C96442', hover: '#B55536' },
        night: {
          DEFAULT: '#0A0A0A',
          surface: '#0F0F0D',
          text: '#EDECEA',
          muted: '#888880',
          border: '#242421',
        },
      },
      fontFamily: {
        fraunces: ['Fraunces Variable', '"Noto Serif SC"', 'Georgia', 'serif'],
        news: ['Newsreader Variable', '"Noto Serif SC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
