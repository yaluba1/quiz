import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pistachio: '#93C572',
          pumpkin: '#FF7518',
          'pistachio-dark': '#7EAC5F',
          'pumpkin-dark': '#E0620D',
        },
        dynamic: {
          primary: 'var(--color-primary, #93C572)',
          secondary: 'var(--color-secondary, #FF7518)',
          bg: 'var(--color-bg, #FFFFFF)',
        },
        darkbg: {
          primary: '#0F172A',
          card: '#1E293B',
          border: '#334155',
        },
        lightbg: {
          primary: '#FFFFFF',
          card: '#F8FAFC',
          border: '#E2E8F0',
        },
        quiz: {
          red: '#EF4444',
          blue: '#3B82F6',
          yellow: '#F59E0B',
          green: '#10B981',
        },
      },
      fontFamily: {
        main: ['var(--font-main, system-ui, -apple-system, sans-serif)'],
      },
    },
  },
  plugins: [],
};

export default config;

