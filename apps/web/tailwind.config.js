export default {
  darkMode:['class'],
  content:['./index.html','./src/**/*.{ts,tsx}'],
  theme:{
    extend:{
      colors:{
        border: "hsl(var(--border))",   // ← ADD THIS LINE
        shamba:{
          50:'#f0fdf6',100:'#dcfcec',200:'#bbf7d8',300:'#86efb6',
          400:'#4ade82',500:'#22c566',600:'#15a552',700:'#138544',
          800:'#146638',900:'#13522e',950:'#052e16',
        },
        earth:{50:'#fafaf5',100:'#f2f2e8',200:'#e5e5d0',500:'#8a8a52',800:'#3d3d22'},
      },
      fontFamily:{
        sans:['Plus Jakarta Sans','system-ui','sans-serif'],
        display:['Fraunces','Georgia','serif'],
        mono:['JetBrains Mono','monospace'],
      },
      keyframes:{
        'fade-in':{ from:{ opacity:'0',transform:'translateY(6px)' }, to:{ opacity:'1',transform:'translateY(0)' } },
        shimmer:{ '0%':{ backgroundPosition:'-200% 0' }, '100%':{ backgroundPosition:'200% 0' } },
      },
      animation:{ 'fade-in':'fade-in 0.35s ease-out forwards', shimmer:'shimmer 1.5s infinite linear' },
    },
  },
  plugins:[require('tailwindcss-animate')],
}