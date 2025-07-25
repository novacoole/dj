import { useState } from 'react'
import Deck from './Deck'
import Mixer from './Mixer'
import WaveformDisplay from './WaveformDisplay'
import { useAudioEngine } from '../hooks/useAudioEngine'

const DJController = () => {
  const { audioEngine } = useAudioEngine()
  const [crossfaderPosition, setCrossfaderPosition] = useState(0)

  const handleCrossfaderChange = (position: number) => {
    setCrossfaderPosition(position)
    audioEngine?.setCrossfader(position)
  }

  if (!audioEngine) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Audio engine not initialized</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top Section - Waveforms and Track Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="waveform-container p-4">
          <div className="text-sm text-gray-400 mb-2">LEFT DECK</div>
          <WaveformDisplay deckId="left" width={600} height={100} />
        </div>
        <div className="waveform-container p-4">
          <div className="text-sm text-gray-400 mb-2">RIGHT DECK</div>
          <WaveformDisplay deckId="right" width={600} height={100} />
        </div>
      </div>

      {/* Main Control Section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Deck */}
        <Deck deckId="left" side="left" />
        
        {/* Center Mixer */}
        <Mixer 
          crossfaderPosition={crossfaderPosition}
          onCrossfaderChange={handleCrossfaderChange}
        />
        
        {/* Right Deck */}
        <Deck deckId="right" side="right" />
      </div>
    </div>
  )
}

export default DJController