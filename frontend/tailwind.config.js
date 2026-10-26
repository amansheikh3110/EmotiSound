/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ece8e1',
        card: '#f6f5f0',
        surface: '#eeeae0',
        'surface-hover': '#e4e0d4',
        border: '#d4cfc0',
        'border-light': '#bebaa8',
        primary: {
          DEFAULT: '#18181a',
          hover: '#28282c',
          muted: '#5c584f',
        },
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
        text: {
          primary: '#18181a',
          secondary: '#5c584f',
          muted: '#8a867c',
        },
        emotion: {
          neutral: '#64748b',
          calm: '#0284c7',
          happy: '#d97706',
          sad: '#2563eb',
          angry: '#dc2626',
          fearful: '#7c3aed',
          disgust: '#059669',
          surprised: '#ea580c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      }
    },
  },
  plugins: [],
}
