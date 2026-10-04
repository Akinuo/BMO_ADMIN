import type { Config } from 'tailwindcss'

// Same denim + topstitch palette as the student site, so both feel like one product.
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        chalk:  '#EEF1F7',
        paper:  '#FFFFFF',
        ink:    '#1E2440',
        muted:  '#5A6284',
        border: '#D3D9E8',
        denim: { DEFAULT: '#22336B', deep: '#141F47', light: '#E4E9F7' },
        thread: '#E59B1C',
        amber: { DEFAULT: '#8F5600', soft: '#FCF1DA', border: '#F0C56E' },
        green: { DEFAULT: '#1E6B47', soft: '#E6F4EC', border: '#9CC7AE' },
        red:   { DEFAULT: '#B4232F', soft: '#FDECEE', border: '#F3B4BA' },
        // podium metals, tuned to sit next to denim
        silver: { DEFAULT: '#8A93B2', soft: '#EDEFF6' },
        bronze: { DEFAULT: '#A5642A', soft: '#F6E9DC' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Atkinson Hyperlegible"', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        sm:  '0 1px 2px rgba(30,36,64,0.06)',
        md:  '0 6px 18px -8px rgba(30,36,64,0.25)',
        nav: '0 1px 0 rgba(30,36,64,0.10)',
      },
      borderRadius: { DEFAULT: '8px', sm: '4px', lg: '14px', full: '9999px' },
    },
  },
} satisfies Config
