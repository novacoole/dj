# DJ Web Application

A modern web-based DJ mixing application built with React and Web Audio API.

## Features

- **Dual Deck System**: Mix between two independent audio decks
- **Vinyl Control**: Realistic turntable interface with scratch functionality
- **Waveform Display**: Visual representation of tracks with seek and scratch capabilities
- **Professional Mixer**: 3-band EQ, gain control, and smooth crossfader
- **Real-time Audio Processing**: Low-latency audio engine using Web Audio API
- **Responsive Design**: Works on desktop and tablet devices

## Technology Stack

- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Three.js + React Three Fiber for 3D graphics
- Web Audio API for audio processing
- Zustand for state management

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/novacoole/dj.git
cd dj

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Load Tracks**: Click "Load Track" on each deck to select audio files
2. **Play/Pause**: Use the play button or spacebar for the active deck
3. **Mix**: Use the crossfader to blend between decks
4. **Scratch**: Click and drag on the vinyl platter or waveform
5. **EQ**: Adjust high, mid, and low frequencies for each deck
6. **Cue**: Set cue points for quick track navigation

## Keyboard Shortcuts

- `Space`: Play/pause active deck
- `←/→`: Seek backward/forward
- `Tab`: Switch active deck

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.