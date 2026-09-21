/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent — a deepened, industrial red rather than a stock
        // "brand red". Used sparingly: active states, key CTAs, alerts.
        accent: {
          DEFAULT: '#8B1E1E',
          hover: '#731818',
          subtle: '#F7E8E8',
        },
        // Sidebar / dark chrome — a cool charcoal, not flat black.
        charcoal: {
          DEFAULT: '#12151A',
          soft: '#1C2028',
          border: '#2A2F3A',
        },
        // Content area — warm off-white, deliberately not stark #FFFFFF
        // and not the generic AI-tell cream.
        surface: {
          DEFAULT: '#F5F4F2',
          card: '#FFFFFF',
          border: '#DDD9D3',
        },
        ink: {
          DEFAULT: '#1C2128',
          muted: '#6B7280',
          faint: '#9CA3AF',
        },
        // Semantic status colors — used for health checks, quiz results,
        // assignment status, etc.
        status: {
          success: '#1F7A4D',
          successSubtle: '#E6F4ED',
          warning: '#B5730A',
          warningSubtle: '#FBF0DE',
          danger: '#A3271F',
          dangerSubtle: '#F8E9E7',
        },
      },
      fontFamily: {
        // IBM Plex Sans: an engineering/technical typeface, a deliberate
        // fit for an industrial-materials training platform.
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        // IBM Plex Mono for tabular numerals in dashboards — functional
        // alignment for data-dense screens, not decoration.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(18, 21, 26, 0.06), 0 1px 3px 0 rgba(18, 21, 26, 0.08)',
      },
    },
  },
  plugins: [],
};
