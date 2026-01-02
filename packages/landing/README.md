# FuelSync Landing Page

Astro-based marketing website for FuelSync application.

## Features

- **Static Site**: Fast, SEO-optimized Astro framework
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Dark Theme**: Consistent with app branding
- **Performance**: Optimized for Core Web Vitals
- **Deployment**: S3 + CloudFront hosting

## Development

```bash
cd packages/landing
npm install
npm run dev
```

## Tech Stack

- **Framework**: Astro 4.x
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
- **Deployment**: AWS S3 + CloudFront

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run astro` - Run Astro CLI commands

## Project Structure

```
src/
├── components/     # Reusable Astro components
├── pages/          # Route pages (index.astro)
├── styles/         # Global CSS styles
└── env.d.ts        # TypeScript environment types
```

## Deployment

The landing page is automatically deployed to:
- **Domain**: fuelsync.vberkoz.com
- **CDN**: CloudFront distribution
- **Storage**: S3 bucket with static website hosting
- **SSL**: ACM certificate with automatic renewal