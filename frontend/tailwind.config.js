/** @type {import('tailwindcss').Config} */

// Each color is a CSS variable holding "R G B" (space-separated), so Tailwind's
// opacity modifiers (bg-accent/10, etc.) keep working via the rgb(var(--x) / <alpha-value>)
// pattern, while the variable itself can be redefined per-theme in index.css
// (:root for light, .dark for dark) without touching any component className.
function withOpacity(cssVar) {
  return `rgb(var(${cssVar}) / <alpha-value>)`;
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent — a deepened, industrial red rather than a stock
        // "brand red". Used sparingly: active states, key CTAs, alerts.
        accent: {
          DEFAULT: withOpacity('--color-accent'),
          hover: withOpacity('--color-accent-hover'),
          subtle: withOpacity('--color-accent-subtle'),
        },
        // Sidebar / dark chrome — a cool charcoal, not flat black.
        charcoal: {
          DEFAULT: withOpacity('--color-charcoal'),
          soft: withOpacity('--color-charcoal-soft'),
          border: withOpacity('--color-charcoal-border'),
        },
        // Content area — warm off-white, deliberately not stark #FFFFFF
        // and not the generic AI-tell cream.
        surface: {
          DEFAULT: withOpacity('--color-surface'),
          card: withOpacity('--color-surface-card'),
          border: withOpacity('--color-surface-border'),
        },
        ink: {
          DEFAULT: withOpacity('--color-ink'),
          muted: withOpacity('--color-ink-muted'),
          faint: withOpacity('--color-ink-faint'),
        },
        // Semantic status colors — used for health checks, quiz results,
        // assignment status, etc.
        status: {
          success: withOpacity('--color-status-success'),
          successSubtle: withOpacity('--color-status-success-subtle'),
          warning: withOpacity('--color-status-warning'),
          warningSubtle: withOpacity('--color-status-warning-subtle'),
          danger: withOpacity('--color-status-danger'),
          dangerSubtle: withOpacity('--color-status-danger-subtle'),
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
