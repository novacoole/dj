import { useState, useEffect } from 'react'
import { useAudioEngine } from '../hooks/useAudioEngine'
import Button from './controls/Button'

const DebugPanel = () => {
  const { audioEngine, audioContext } = useAudioEngine()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioEngine && audioContext) {
        const leftDeck = audioEngine.decks.get('left')
        const rightDeck = audioEngine.decks.get('right')

        setDebugInfo({
          audioContext: {
            state: audioContext.state,
            sampleRate: audioContext.sampleRate,
            currentTime: audioContext.currentTime.toFixed(2)
          },
          leftDeck: leftDeck ? {
            isPlaying: leftDeck.isPlaying,
            volume: leftDeck.volume.toFixed(2),
            pitch: leftDeck.pitch.toFixed(2),
            bpm: leftDeck.bpm.toFixed(1),
            hasAudio: !!leftDeck.audioBuffer,
            hasSource: !!leftDeck.sourceNode
          } : null,
          rightDeck: rightDeck ? {
            isPlaying: rightDeck.isPlaying,
            volume: rightDeck.volume.toFixed(2),
            pitch: rightDeck.pitch.toFixed(2),
            bpm: rightDeck.bpm.toFixed(1),
            hasAudio: !!rightDeck.audioBuffer,
            hasSource: !!rightDeck.sourceNode
          } : null
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [audioEngine, audioContext])

  const testAudioContext = async () => {
    if (!audioContext) return

    try {
      console.log('Testing AudioContext...')
      
      // Resume if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
        console.log('AudioContext resumed')
      }

      // Create test tone
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5)

      console.log('Test tone played')
    } catch (error) {
      console.error('AudioContext test failed:', error)
    }
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(true)}
        >
          Debug
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-mixxx-dark border border-gray-600 rounded-lg p-4 max-w-sm text-xs font-mono z-40">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-mixxx-blue">Debug Panel</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-gray-300">
        <div>
          <div className="font-semibold text-yellow-400">AudioContext</div>
          <div>State: <span className="text-green-400">{debugInfo.audioContext?.state}</span></div>
          <div>Rate: {debugInfo.audioContext?.sampleRate}Hz</div>
          <div>Time: {debugInfo.audioContext?.currentTime}s</div>
        </div>

        {debugInfo.leftDeck && (
          <div>
            <div className="font-semibold text-blue-400">Left Deck</div>
            <div>Playing: <span className={debugInfo.leftDeck.isPlaying ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.leftDeck.isPlaying ? 'Yes' : 'No'}
            </span></div>
            <div>Volume: {debugInfo.leftDeck.volume}</div>
            <div>Audio: <span className={debugInfo.leftDeck.hasAudio ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.leftDeck.hasAudio ? 'Loaded' : 'None'}
            </span></div>
            <div>Source: <span className={debugInfo.leftDeck.hasSource ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.leftDeck.hasSource ? 'Active' : 'None'}
            </span></div>
          </div>
        )}

        {debugInfo.rightDeck && (
          <div>
            <div className="font-semibold text-blue-400">Right Deck</div>
            <div>Playing: <span className={debugInfo.rightDeck.isPlaying ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.rightDeck.isPlaying ? 'Yes' : 'No'}
            </span></div>
            <div>Volume: {debugInfo.rightDeck.volume}</div>
            <div>Audio: <span className={debugInfo.rightDeck.hasAudio ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.rightDeck.hasAudio ? 'Loaded' : 'None'}
            </span></div>
            <div>Source: <span className={debugInfo.rightDeck.hasSource ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.rightDeck.hasSource ? 'Active' : 'None'}
            </span></div>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={testAudioContext}
        >
          Test Audio
        </Button>
      </div>
    </div>
  )
}

export default DebugPanel