# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a web-based clone of Mixxx DJ software, implementing core DJ functionality using modern web technologies. The project includes the original Mixxx C++ source code in `/mixxx/` for reference.

## Commands

```bash
npm run dev          # Start development server (runs on port 3000, 3001, or 3002)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS (custom Mixxx color scheme)
- **3D Graphics**: Three.js + React Three Fiber
- **State**: Zustand + Valtio
- **Audio**: Web Audio API

### Core Components

1. **AudioEngine** (`src/engine/AudioEngine.ts`)
   - Central audio processing using Web Audio API
   - Manages dual decks with independent audio graphs
   - Implements Mixxx-style scratch control with position normalization
   - Crossfader with equal power curve
   - Key methods: `loadTrack()`, `play()`, `setScratchPosition()`, `scratchByAngle()`, `scratchByPosition()`

2. **Deck System** (`src/components/Deck.tsx`)
   - Individual deck UI combining all controls
   - Integrates VinylPlatter, WaveformDisplay, and audio controls
   - Handles user interactions and communicates with AudioEngine

3. **Vinyl Platter** (`src/components/VinylPlatter.tsx`)
   - 250px diameter platter with rotation animation
   - Tracks full rotations for accurate scratch position
   - Implements drag-to-scratch with angle calculation
   - 33 RPM rotation speed standard

4. **Waveform Display** (`src/components/WaveformDisplay.tsx`)
   - Canvas-based waveform rendering
   - Fixed center playhead with scrolling waveform
   - 10% zoom level (shows 5% before and after playhead)
   - Click-to-seek and drag-to-scratch functionality

### Scratch Implementation

The scratch system closely follows Mixxx's approach:
- Scratch position is normalized by `(bufferSize * sampleRate)` 
- Uses playback rate modulation for authentic scratch sound
- Shared scratch logic between platter and waveform via `scratchByAngle()` and `scratchByPosition()` helpers
- Rate calculation based on position delta over time

### Audio Processing Flow
1. Audio files loaded into AudioBuffer
2. Connected through: Source → Gain → Deck Output
3. Deck outputs mixed through crossfader
4. Final output to destination

## Key Implementation Details

- **Buffer Size**: Uses 128 samples (Web Audio default) for normalization calculations
- **Sample Rate**: Multiplies by 2 for stereo when converting to samples
- **Platter Sensitivity**: Angle changes converted to time using 33 RPM standard
- **Position Tracking**: Maintains scratch position separate from playback position

## Reference Implementation

The `/mixxx/` directory contains the original Mixxx C++ source code, particularly useful for:
- `src/engine/positionscratchcontroller.cpp` - Scratch control algorithms
- `src/widget/wspinnybase.cpp` - Platter angle calculations
- `src/engine/controls/ratecontrol.cpp` - Rate control implementation