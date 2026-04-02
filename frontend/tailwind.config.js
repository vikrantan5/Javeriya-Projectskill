/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
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
                                foreground: 'hsl(var(--primary-foreground))'
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
                                foreground: 'hsl(var(--accent-foreground))'
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
                        },
                        beige: {
                                50: '#fdfbf7',
                                100: '#f9f5ed',
                                200: '#f4ede0',
                                300: '#ebe2d0',
                                400: '#e0d3bb',
                                500: '#d4c4a8',
                                600: '#c2ab8a',
                                700: '#a78f6f',
                                800: '#8b7558',
                                900: '#6e5d47'
                        }
                },
                keyframes: {
                        'accordion-down': {
                                from: {
                                        height: '0'
                                },
                                to: {
                                        height: 'var(--radix-accordion-content-height)'
                                }
                        },
                        'accordion-up': {
                                from: {
                                        height: 'var(--radix-accordion-content-height)'
                                },
                                to: {
                                        height: '0'
                                }
                        },
                        'float': {
                                '0%, 100%': { transform: 'translateY(0px)' },
                                '50%': { transform: 'translateY(-20px)' }
                        },
                        'float-slow': {
                                '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
                                '33%': { transform: 'translateY(-30px) translateX(20px)' },
                                '66%': { transform: 'translateY(15px) translateX(-20px)' }
                        },
                        'slide-up': {
                                from: { opacity: '0', transform: 'translateY(30px)' },
                                to: { opacity: '1', transform: 'translateY(0)' }
                        },
                        'slide-in': {
                                from: { opacity: '0', transform: 'translateX(-30px)' },
                                to: { opacity: '1', transform: 'translateX(0)' }
                        },
                        'fade-in': {
                                from: { opacity: '0' },
                                to: { opacity: '1' }
                        },
                        'shimmer': {
                                '0%': { backgroundPosition: '-1000px 0' },
                                '100%': { backgroundPosition: '1000px 0' }
                        },
                        'glow': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0.6' }
                        },
                        'bounce-subtle': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-5px)' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'float': 'float 6s ease-in-out infinite',
                        'float-slow': 'float-slow 8s ease-in-out infinite',
                        'slide-up': 'slide-up 0.6s ease-out',
                        'slide-in': 'slide-in 0.6s ease-out',
                        'fade-in': 'fade-in 0.8s ease-out',
                        'shimmer': 'shimmer 3s linear infinite',
                        'glow': 'glow 2s ease-in-out infinite',
                        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite'
                },
                backgroundImage: {
                        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                        'beige-gradient': 'linear-gradient(135deg, #fdfbf7 0%, #f9f5ed 25%, #f4ede0 50%, #ebe2d0 75%, #fdfbf7 100%)',
                },
                boxShadow: {
                        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
                        'glow-sm': '0 0 15px rgba(139, 92, 246, 0.3)',
                        'glow-md': '0 0 25px rgba(139, 92, 246, 0.4)',
                        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
