# Endurance Protocol

An interactive asteroid impact simulator that demonstrates planetary defense capabilities using real NASA data and physics-based calculations.

## Overview

Endurance Protocol provides an educational platform for understanding asteroid threats and planetary defense strategies. Users can explore near-Earth objects from NASA's database, simulate impacts at any location on Earth, and evaluate the effectiveness of kinetic impactor missions like NASA's DART.

## Features

- Real-time integration with NASA Near-Earth Object Web Service (NeoWs) API
- Interactive 3D Earth visualization with WebGL rendering
- Physics-based impact modeling including crater formation, energy release, and casualty estimation
- Planetary defense simulation using momentum transfer calculations
- AI-generated scenario analysis via Google Gemini
- Historical impact and earthquake comparisons
- Responsive design for desktop and mobile devices

## Technology Stack

- **Frontend Framework**: Next.js 15 with React 19
- **3D Graphics**: React Three Fiber with Three.js
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS
- **AI Integration**: Google Generative AI (Gemini)
- **Data Sources**: NASA NeoWs API
- **Deployment**: Vercel

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JittoJoseph/Endurance-Protocol.git
   cd endurance-protocol
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Obtain API keys:
   - NASA API key from https://api.nasa.gov/
   - Google Gemini API key from https://makersuite.google.com/app/apikey

4. Create environment file:
   ```bash
   # .env.local
   NASA_API_KEY=your_nasa_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Usage

1. Browse the asteroid carousel populated with real NASA data
2. Select an asteroid to view its orbital characteristics
3. Click on the 3D Earth or choose from preset city locations
4. Review impact calculations and AI-generated analysis
5. Activate DART defense simulation to evaluate deflection outcomes

## Physics Calculations

The application implements scientifically-grounded formulas for impact modeling:

- **Kinetic Energy**: E = ½mv²
- **TNT Equivalent**: Conversion using 4.184 × 10¹⁵ J per megaton
- **Crater Diameter**: Empirical scaling laws based on projectile parameters
- **DART Deflection**: Momentum transfer with ejecta enhancement factor (β = 3.6)

## Educational Value

Endurance Protocol serves as an educational tool to:
- Demonstrate the scale and frequency of near-Earth asteroid encounters
- Illustrate the physics of high-velocity impacts
- Explain planetary defense strategies and their limitations
- Provide context through historical impact events and seismic comparisons

## API Endpoints

- `GET /api/neo` - Fetches filtered asteroid data from NASA
- `POST /api/gemini` - Generates AI analysis of impact scenarios

## Contributing

Contributions are welcome. Areas for improvement include:
- Additional planetary defense techniques
- Enhanced visualization features
- Multi-language support
- Performance optimizations

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- NASA for providing open asteroid data and planetary defense research
- Google for Gemini AI API
- Open source community for Three.js, React, and related libraries