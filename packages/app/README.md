# FuelSync App

React TypeScript PWA frontend for FuelSync vehicle expense tracking.

## ✅ Features Complete

- **Authentication**: Login/register with Cognito
- **Vehicle Management**: Full CRUD with multi-vehicle support
- **Refill Tracking**: Fuel consumption with infinite scroll
- **Expense Management**: 15 categories with monthly grouping
- **Analytics**: Statistics cards and Chart.js visualizations
- **PWA**: Offline support and installable experience
- **i18n**: English and Ukrainian language support
- **Responsive**: Mobile-first design with touch-friendly UI

## Setup

```bash
cd packages/app
npm install
cp .env.example .env
# Update .env with API Gateway URL and Cognito details
npm run dev
```

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **PWA**: vite-plugin-pwa with Workbox
- **Styling**: Tailwind CSS + HeadlessUI + Heroicons
- **Routing**: React Router v6
- **State**: Zustand (auth, vehicle) + TanStack Query (server state)
- **Charts**: Chart.js + react-chartjs-2
- **i18n**: react-i18next with localStorage persistence
- **Fonts**: JetBrains Mono for numbers

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - TypeScript type checking

## Environment Variables

```env
VITE_API_URL=https://your-api-gateway-url.amazonaws.com/v1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=us-east-1
```
