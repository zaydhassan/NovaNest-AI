/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "Inter", "sans-serif"],
      },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
          strong: 'hsl(var(--primary-strong))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))',
          warm: 'hsl(var(--accent-warm))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
  			lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        xl: 'var(--radius-lg)',
        '2xl': 'var(--radius-xl)',
        '3xl': 'var(--radius-2xl)'
  		},
      boxShadow: {
        glass: '0 10px 40px -12px hsl(0 0% 0% / 0.55)',
        'glass-lg': '0 24px 70px -20px hsl(0 0% 0% / 0.65)',
        glow: '0 0 0 1px hsl(var(--purple) / 0.25), 0 12px 40px -8px hsl(var(--purple) / 0.45)',
        'glow-cyan': '0 0 0 1px hsl(var(--cyan) / 0.20), 0 16px 50px -12px hsl(var(--cyan) / 0.45)',
        'glow-emerald': '0 0 0 1px hsl(var(--emerald) / 0.20), 0 16px 50px -12px hsl(var(--emerald) / 0.40)',
        elevated: '0 1px 0 0 hsl(0 0% 100% / 0.04) inset, 0 20px 50px -24px hsl(0 0% 0% / 0.7)'
  		},
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
        'aurora': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'floaty': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'aurora': 'aurora 8s ease infinite',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
        'floaty': 'floaty 7s ease-in-out infinite',
        'marquee': 'marquee 32s linear infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        'spin-slow': 'spin-slow 18s linear infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};