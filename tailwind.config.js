/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#f0f4f8',
            100: '#d9e2ec',
            200: '#bcccdc',
            300: '#9fb3c8',
            400: '#829ab1',
            500: '#627d98',
            600: '#486581',
            700: '#334e68',
            800: '#243b53',
            900: '#102a43',
          },
          secondary: {
            50: '#fffbea',
            100: '#fff3c4',
            200: '#fce588',
            300: '#fadb5f',
            400: '#f7c948',
            500: '#f0b429',
            600: '#de911d',
            700: '#cb6e17',
            800: '#b44d12',
            900: '#8d2b0b',
          },
          accent: {
            50: '#ffe3ec',
            100: '#ffb8d2',
            200: '#ff8cba',
            300: '#f364a2',
            400: '#e8368f',
            500: '#da127d',
            600: '#bc0a6f',
            700: '#a30664',
            800: '#870557',
            900: '#620042',
          },
          neutral: {
            50: '#f5f7fa',
            100: '#e4e7eb',
            200: '#cbd2d9',
            300: '#9aa5b1',
            400: '#7b8794',
            500: '#616e7c',
            600: '#52606d',
            700: '#3e4c59',
            800: '#323f4b',
            900: '#1f2933',
          },
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          serif: ['Georgia', 'serif'],
        },
        borderRadius: {
          '4xl': '2rem',
        },
        spacing: {
          '128': '32rem',
          '144': '36rem',
        },
      },
    },
    plugins: [],
  }