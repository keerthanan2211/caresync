import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F6F8',
        ink: '#16202E',
        muted: '#5A6474',
        line: '#DDE2E8',
        plum: { DEFAULT: '#6B3FA0', dark: '#552F82', soft: '#F1EBF8' },
        // Clinical status colours: always paired with a text label and an icon shape
        normal: { DEFAULT: '#1E7B4F', soft: '#E6F4EC' },
        watch: { DEFAULT: '#9A5B0B', soft: '#FDF1DC' },
        critical: { DEFAULT: '#B42318', soft: '#FDE8E6' },
      },
      fontFamily: { sans: ['var(--font-public)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
