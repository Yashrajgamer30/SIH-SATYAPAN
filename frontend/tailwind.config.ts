import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Noto Sans Mono"', 'sans-serif'],
      },
      fontSize: {
        '12': ['0.75rem', { lineHeight: '1.5' }],
        '14': ['0.875rem', { lineHeight: '1.5' }],
        '16': ['1rem', { lineHeight: '1.6' }],
        '18': ['1.125rem', { lineHeight: '1.5' }],
        '20': ['1.25rem', { lineHeight: '1.4' }],
        '24': ['1.5rem', { lineHeight: '1.3' }],
        '32': ['2rem', { lineHeight: '1.25' }],
        '40': ['2.5rem', { lineHeight: '1.2' }],
      },
      colors: {
        navy: {
          900: 'var(--navy-900)',
          700: 'var(--navy-700)',
          500: 'var(--navy-500)',
          50: 'var(--navy-50)',
        },
        saffron: {
          500: 'var(--saffron-500)',
          50: 'var(--saffron-50)',
        },
        green: {
          600: 'var(--green-600)',
          50: 'var(--green-50)',
        },
        'chakra-blue': '#000080',
        danger: {
          DEFAULT: 'var(--danger)',
          50: 'var(--danger-50)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          50: 'var(--warning-50)',
        },
        info: {
          DEFAULT: 'var(--info)',
          50: 'var(--info-50)',
        },
        gov: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          subtle: 'var(--color-surface-subtle)',
          border: 'var(--color-border)',
          borderStrong: 'var(--color-border-strong)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          focus: 'var(--color-focus)',
        }
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0, 0, 0.2, 1)',
      }
    },
  },
  plugins: [],
} satisfies Config
