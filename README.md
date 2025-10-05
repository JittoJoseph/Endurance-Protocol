# 🌍 Endurance Protocol

**Visualizing Planetary Defense for All**

> An interactive asteroid impact simulator using real-time NASA data, physics-based calculations, and AI-generated explanations.

[![NASA Space Apps Challenge 2025](https://img.shields.io/badge/NASA-Space%20Apps%202025-blue)](https://www.spaceappschallenge.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-9.3-orange)](https://docs.pmnd.rs/react-three-fiber/)

[🚀 Live Demo](https://endurance-protocol.vercel.app) • [📖 Documentation](SUBMISSION.md) • [🎥 Demo Video](https://youtu.be/YOUR_VIDEO_ID)

---

## 🎯 What Is This?

Endurance Protocol makes asteroid science accessible to everyone. Select from live NASA asteroid data, click anywhere on Earth, and see what would happen if that asteroid hit. Then activate NASA's DART defense simulation to see if we can save the planet.

**Key Features:**

- 🛰️ **Real-time NASA data** from NeoWs API
- 🌍 **Interactive 3D Earth** with WebGL graphics
- 🔬 **Physics-based impact calculations** (crater, energy, casualties)
- 🤖 **AI-generated explanations** via Google Gemini
- 🎯 **DART planetary defense simulation** based on the real mission
- 📊 **Historical comparisons** with 22 verified impacts and 35 earthquakes

---

## 🚀 Quick Start

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

## 📚 Submission Documents

- **[SUBMISSION.md](SUBMISSION.md)** - Complete NASA Space Apps Challenge submission
- **[DEMO-SCRIPT.md](DEMO-SCRIPT.md)** - 30-second video script and presentation notes
- **[PRESENTATION-OUTLINE.md](PRESENTATION-OUTLINE.md)** - 7-slide deck structure
- **[SUBMISSION-FORM-GUIDE.md](SUBMISSION-FORM-GUIDE.md)** - Copy-paste ready form answers

---

## 🌟 NASA Space Apps Challenge 2025

This project was created for the NASA Space Apps Challenge 2025. It uses:

### NASA Data & Resources:

- **NASA NeoWs API** - Real-time asteroid close approach data
- **NASA DART Mission** - Momentum enhancement factor (β=3.6)
- **NASA Blue Marble** - Earth surface textures
- **NASA CNEOS** - Impact risk methodologies

### Technology Stack:

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **3D Graphics**: React Three Fiber + Three.js
- **AI**: Google Gemini (gemini-1.5-flash)
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion

### Educational Impact:

- Makes complex asteroid science accessible
- Shows NASA's planetary defense capabilities
- Demonstrates real DART mission physics
- Empowers public understanding of space threats

---

## 🎥 Demo & Presentation

### 30-Second Demo Script:

1. **[0-3s]** Title: "Endurance Protocol - Planetary Defense"
2. **[3-8s]** Show Earth with asteroid carousel
3. **[8-18s]** Impact simulation with metrics
4. **[18-25s]** DART defense activation
5. **[25-30s]** Success message and call to action

See [DEMO-SCRIPT.md](DEMO-SCRIPT.md) for full details.

---

## 🧮 Physics & Accuracy

All calculations use scientifically-grounded formulas:

- **Mass**: `m = (4/3)πr³ × ρ` where ρ = 3000 kg/m³
- **Kinetic Energy**: `KE = ½mv²`
- **TNT Equivalent**: `MT = KE / 4.184×10¹⁵`
- **Crater Diameter**: `D = 1.8 × (d/1000)^0.78 × (ρ/3000)^0.33`
- **DART Deflection**: Momentum transfer with β=3.6 (from actual mission)

See [lib/physics.ts](src/lib/physics.ts) for implementation.

---

## 🤖 AI Transparency

We use **Google Gemini AI** exclusively for generating human-readable explanations of impact scenarios.

**What AI does:**

- ✅ Generates narrative summaries of impact consequences
- ✅ Explains technical metrics in plain English
- ✅ Provides emergency response recommendations

**What AI does NOT do:**

- ❌ Scientific calculations (all done by deterministic code)
- ❌ 3D graphics generation (procedural Three.js code)
- ❌ Data collection (direct NASA API integration)

All AI-generated text is clearly labeled in the UI with "AI Analysis" headers.

---

## 📊 Data Sources

### Verified Historical Data:

- **22 Impact Events** - From Chicxulub (65M years ago) to Chelyabinsk (2013)
- **35 Major Earthquakes** - Magnitude 6.6-9.5, verified USGS data

All events cross-referenced with scientific literature.

---

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- 🌐 Multi-language support (Spanish, Mandarin, Hindi)
- 📱 Mobile AR mode (view asteroids in your sky)
- 📚 Educational curriculum integration
- 🔗 Social sharing features

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **NASA** - For open data and planetary defense research
- **Google** - For Gemini AI API
- **Open Source Community** - Three.js, React, Next.js, and all dependencies
- **Scientific Community** - Impact physics research and historical data

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/JittoJoseph/Endurance-Protocol/issues)
- **NASA API Docs**: https://api.nasa.gov/
- **Project Demo**: https://endurance-protocol.vercel.app

---

**Built with 💙 for NASA Space Apps Challenge 2025**

_Making space science accessible, one asteroid at a time._
