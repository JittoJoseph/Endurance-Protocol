# 🌍 Endurance Protocol - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Get NASA API Key

1. Go to https://api.nasa.gov/
2. Fill in your details
3. Copy your API key

### 3. Create Environment File

Create a file named `.env.local` in the project root:

```bash
# .env.local
NASA_API_KEY=your_nasa_api_key_here
GEMINI_API_KEY=your_gemini_key_here
```

**Important:** Never commit `.env.local` to git!

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Keys

### NASA API Key (Required)
- **Website:** https://api.nasa.gov/
- **Free tier:** 1,000 requests/hour
- **What we use:** NEO (Near-Earth Object) data

### Google Gemini API Key (Optional - for AI summaries)
- **Website:** https://makersuite.google.com/app/apikey
- **What we use:** Generate impact summaries

## Troubleshooting

### "NASA_API_KEY not configured"
- Make sure you created `.env.local` file
- Check that the key name is exactly `NASA_API_KEY`
- Restart the dev server after adding the key

### No asteroids loading
1. Check browser console for errors
2. Verify your NASA API key is valid
3. Check your internet connection
4. Try the demo key: `DEMO_KEY` (limited requests)

### WebGL errors
- Your browser needs WebGL support
- Try Chrome or Firefox
- Update your graphics drivers

## Project Structure

```
/endurance-protocol
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── neo/route.ts       # NASA API proxy
│   │   │   └── gemini/route.ts    # Gemini API proxy
│   │   ├── page.tsx                # Main page
│   │   └── globals.css
│   ├── components/
│   │   ├── EarthScene.tsx          # 3D Earth
│   │   ├── AsteroidCarousel.tsx    # Asteroid selector
│   │   ├── Controls.tsx            # City presets
│   │   └── InfoPanel.tsx           # Impact metrics
│   ├── lib/
│   │   ├── nasa.ts                 # NASA API functions
│   │   ├── gemini.ts               # Gemini AI functions
│   │   ├── physics.ts              # Impact calculations
│   │   └── cameraAnimation.ts      # Camera system
│   └── types/
│       └── index.ts                # TypeScript interfaces
└── public/
    └── texture/                    # Earth textures
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing API Endpoints

```bash
# Test NEO endpoint
curl http://localhost:3000/api/neo

# Test Gemini endpoint
curl -X POST http://localhost:3000/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"promptType":"compact","payload":{...}}'
```

## Features

✅ Real-time NASA NEO data
✅ Interactive 3D Earth
✅ Click to select impact point
✅ Physics-based impact calculations
✅ AI-generated summaries
✅ Camera animation system
⏳ DART deflection simulation (coming soon)

## Tech Stack

- **Framework:** Next.js 15.5 + React 19
- **3D:** React Three Fiber + Drei
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **APIs:** NASA NeoWs, Google Gemini

## Contributing

1. Fork the repo
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

- **Issues:** https://github.com/your-repo/issues
- **Docs:** See /docs folder
- **NASA API Docs:** https://api.nasa.gov/
