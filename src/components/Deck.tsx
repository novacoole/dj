import { useState, useRef, useCallback } from 'react'
import VinylPlatter from './VinylPlatter'
import { useAudioEngine } from '../hooks/useAudioEngine'
import Knob from './controls/Knob'
import Slider from './controls/Slider'
import Button from './controls/Button'

interface DeckProps {
  deckId: string
  side: 'left' | 'right'
}

const Deck = ({ deckId, side }: DeckProps) => {
  const { audioEngine } = useAudioEngine()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [deckState, setDeckState] = useState({
    isPlaying: false,
    volume: 0.8,
    pitch: 0,
    trackName: '',
    bpm: 120
  })

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !audioEngine) {
      console.error('No file selected or no audio engine')
      return
    }

    console.log('File selected:', file.name, file.type, file.size)

    // Check file type
    if (!file.type.startsWith('audio/')) {
      console.error('Invalid file type:', file.type)
      alert('Please select an audio file (MP3, WAV, etc.)')
      return
    }

    try {
      console.log(`Starting track load for deck ${deckId}`)
      await audioEngine.loadTrack(deckId, file)
      
      const deck = audioEngine.decks.get(deckId)
      console.log('Track loaded, updating deck state:', deck)
      
      setDeckState(prev => ({
        ...prev,
        trackName: file.name.replace(/\.[^/.]+$/, ''),
        bpm: deck?.bpm || 120
      }))
      
      console.log(`Track ${file.name} loaded successfully for deck ${deckId}`)
    } catch (error) {
      console.error('Failed to load track:', error)
      alert(`Failed to load track: ${error}`)
    }

    // Clear the input so the same file can be loaded again
    event.target.value = ''
  }, [audioEngine, deckId])

  const handlePlayPause = useCallback(async () => {
    if (!audioEngine) {
      console.error('Audio engine not available')
      return
    }

    const deck = audioEngine.decks.get(deckId)
    if (!deck?.audioBuffer) {
      console.error(`No audio buffer loaded for deck ${deckId}`)
      return
    }

    try {
      if (deckState.isPlaying) {
        audioEngine.stop(deckId)
        setDeckState(prev => ({ ...prev, isPlaying: false }))
      } else {
        await audioEngine.play(deckId)
        setDeckState(prev => ({ ...prev, isPlaying: true }))
      }
    } catch (error) {
      console.error(`Failed to ${deckState.isPlaying ? 'stop' : 'play'} deck ${deckId}:`, error)
    }
  }, [audioEngine, deckId, deckState.isPlaying])

  const handleVolumeChange = useCallback((value: number) => {
    audioEngine?.setVolume(deckId, value)
    setDeckState(prev => ({ ...prev, volume: value }))
  }, [audioEngine, deckId])

  const handlePitchChange = useCallback((value: number) => {
    audioEngine?.setPitch(deckId, value)
    setDeckState(prev => ({ ...prev, pitch: value }))
  }, [audioEngine, deckId])

  const handlePlatterSeek = useCallback((deltaPosition: number) => {
    // Not used when using Mixxx-style scratch control
  }, [audioEngine, deckId])

  const handlePlatterScratch = useCallback((angleDelta: number) => {
    if (!audioEngine) return
    
    // Use the shared scratch logic
    audioEngine.scratchByAngle(deckId, angleDelta)
  }, [deckId, audioEngine])
  
  const handleScratchStart = useCallback(() => {
    audioEngine?.enableScratch(deckId)
  }, [audioEngine, deckId])
  
  const handleScratchEnd = useCallback(() => {
    audioEngine?.disableScratch(deckId)
  }, [audioEngine, deckId])

  return (
    <div className="bg-mixxx-dark rounded-lg p-6 border border-gray-700">
      {/* Track Info */}
      <div className="text-center mb-4">
        <div className="text-sm text-gray-400 uppercase tracking-wide">
          {side} Deck
        </div>
        <div className="font-semibold text-lg truncate">
          {deckState.trackName || 'No Track Loaded'}
        </div>
        <div className="text-sm text-mixxx-blue">
          {deckState.bpm.toFixed(1)} BPM
        </div>
      </div>

      {/* Vinyl Platter */}
      <div className="flex justify-center mb-6">
        <VinylPlatter 
          isPlaying={deckState.isPlaying}
          size={250}
          onSeek={handlePlatterSeek}
          onScratch={handlePlatterScratch}
          onScratchStart={handleScratchStart}
          onScratchEnd={handleScratchEnd}
        />
      </div>

      {/* Transport Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Load
        </Button>
        <Button
          variant={deckState.isPlaying ? "danger" : "primary"}
          onClick={handlePlayPause}
        >
          {deckState.isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => audioEngine?.stop(deckId)}
        >
          Stop
        </Button>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Volume */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 w-16">Volume</label>
          <div className="flex-1">
            <Knob
              value={deckState.volume}
              onChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-gray-400">Pitch</label>
            <div className="text-xs text-gray-400">
              {(deckState.pitch * 8).toFixed(1)}%
            </div>
          </div>
          <div className="flex justify-center">
            <Slider
              value={deckState.pitch}
              onChange={handlePitchChange}
              min={-1}
              max={1}
              step={0.001}
              orientation="vertical"
              height={120}
              width={40}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>-8%</span>
            <span>+8%</span>
          </div>
        </div>

        {/* BPM Display */}
        <div className="text-center p-2 bg-gray-800 rounded">
          <div className="text-2xl font-mono text-mixxx-green">
            {(deckState.bpm * (1 + deckState.pitch * 0.08)).toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">BPM</div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}

export default Deck