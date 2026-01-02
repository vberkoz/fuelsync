# PWA Setup

FuelSync is now a Progressive Web App (PWA) with offline support and installable capabilities.

## Features

- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Cached assets and API responses available offline
- **Auto-Update**: Service worker updates automatically on new deployments
- **Native Experience**: Full-screen standalone app mode

## Configuration

### Vite PWA Plugin
- Auto-update registration
- Workbox for service worker generation
- NetworkFirst strategy for API calls (5-minute cache)
- Asset caching for all static files

### Web App Manifest
- Name: FuelSync
- Theme: Dark (#1f2937)
- Display: Standalone
- Icons: 192x192 and 512x512

## Icons

Current icons are placeholders (FS text on dark background). Replace with custom icons:

```bash
# Replace these files in packages/app/public/
icon-192.png  # 192x192 app icon
icon-512.png  # 512x512 app icon
```

## Testing PWA

### Local Development
```bash
npm run build
npm run preview
```

### Chrome DevTools
1. Open DevTools → Application tab
2. Check "Manifest" for app details
3. Check "Service Workers" for registration
4. Test offline mode in Network tab

### Install Prompt
- Desktop: Look for install icon in address bar
- Mobile: "Add to Home Screen" in browser menu

## Deployment

PWA works automatically after deployment to S3/CloudFront. Ensure:
- HTTPS is enabled (required for service workers)
- Proper MIME types for manifest.json
- Cache headers configured for service worker updates

## Caching Strategy

- **Static Assets**: Cache-first (JS, CSS, images, fonts)
- **API Calls**: Network-first with 5-minute fallback cache
- **HTML**: Network-first for latest content

## Browser Support

- Chrome/Edge: Full support
- Safari: Full support (iOS 11.3+)
- Firefox: Full support
- Opera: Full support
