import { useEffect, useState } from 'react'
import DJController from './components/DJController'
import AudioDeviceSelector from './components/AudioDeviceSelector'
import DebugPanel from './components/DebugPanel'
import { useAudioEngine } from './hooks/useAudioEngine'
import Button from './components/controls/Button'

function App() {
  const { initializeAudio, audioContext } = useAudioEngine()
  const [showDeviceSelector, setShowDeviceSelector] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const handleInitializeAudio = () => {
    initializeAudio()
    setIsInitialized(true)
  }

  useEffect(() => {
    // Auto-initialize audio on first user interaction for smoother experience
    const handleUserInteraction = () => {
      if (!audioContext && !isInitialized) {
        handleInitializeAudio()
        document.removeEventListener('click', handleUserInteraction)
        document.removeEventListener('touchstart', handleUserInteraction)
      }
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('touchstart', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [audioContext, isInitialized])

  return (
    <div className="min-h-screen bg-mixxx-darker p-4">
      <header className="text-center py-4">
        <h1 className="text-4xl font-bold text-mixxx-blue">
          Mixxx Web Clone
        </h1>
        <p className="text-gray-400 mt-2">
          Professional DJ Software in Your Browser
        </p>
        
        {audioContext && (
          <div className="mt-4 flex justify-center gap-4">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowDeviceSelector(true)}
            >
              Audio Settings
            </Button>
            <div className="text-sm text-green-400 flex items-center">
              ● Audio Ready ({audioContext.state})
            </div>
          </div>
        )}
      </header>
      
      <main className="flex justify-center">
        <DJController />
      </main>
      
      {!audioContext && !isInitialized && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-mixxx-dark p-8 rounded-lg text-center border border-gray-600">
            <h2 className="text-xl font-bold mb-4">Initialize Audio</h2>
            <p className="text-gray-400 mb-6">
              Click to start the audio engine and begin mixing!
            </p>
            <div className="space-y-3">
              <Button variant="primary" onClick={handleInitializeAudio}>
                Start Audio Engine
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowDeviceSelector(true)}
              >
                Audio Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeviceSelector && (
        <AudioDeviceSelector
          onDeviceSelect={(deviceId) => {
            console.log('Selected audio device:', deviceId)
            // Note: Web browsers have limited device selection capabilities
          }}
          onClose={() => setShowDeviceSelector(false)}
        />
      )}

      <DebugPanel />
    </div>
  )
}

export default App