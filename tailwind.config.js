/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gds-blue': '#1d70b8',
        'gds-blue-light': '#5694ca',
        'gds-black': '#0b0c0c',
        'gds-grey': '#b1b4b6',
        'gds-light-grey': '#f3f2f1',
        'category-service': '#1d70b8',
        'category-product': '#5694ca',
        'category-users': '#00703c',
        'category-business': '#912b88',
        'category-market': '#f47738',
        'category-technology': '#d4351c',
        'category-delivery': '#ffdd00',
        'category-stakeholders': '#4c2c92',
        'risk-low': '#d1fae5',
        'risk-medium': '#fef3c7',
        'risk-high': '#fee2e2',
        'quadrant-priority': '#fff4e6',
        'quadrant-validate': '#e6f7ff',
        'quadrant-defer': '#f5f5f5',
        'quadrant-document': '#f0f0f0',
      },
    },
  },
  plugins: [],
}
