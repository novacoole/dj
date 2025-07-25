import { create } from 'zustand'
import { AudioEngine } from '../engine/AudioEngine'

interface AudioEngineState {
  audioContext: AudioContext | null
  audioEngine: AudioEngine | null
  isInitialized: boolean
  initializeAudio: () => void
  destroyAudio: () => void
}

export const useAudioEngine = create<AudioEngineState>((set, get) => ({
  audioContext: null,
  audioEngine: null,
  isInitialized: false,

  initializeAudio: async () => {
    const { audioContext } = get()
    if (audioContext) return // Already initialized

    try {
      console.log('Initializing AudioContext...')
      const context = new AudioContext()
      
      // Resume context if it's suspended
      if (context.state === 'suspended') {
        console.log('AudioContext suspended, attempting to resume...')
        await context.resume()
      }
      
      const engine = new AudioEngine(context)
      
      set({
        audioContext: context,
        audioEngine: engine,
        isInitialized: true
      })

      console.log('Audio engine initialized successfully:', {
        sampleRate: context.sampleRate,
        state: context.state,
        maxChannelCount: context.destination.maxChannelCount
      })
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
      alert(`Failed to initialize audio: ${error}`)
    }
  },

  destroyAudio: () => {
    const { audioEngine, audioContext } = get()
    
    if (audioEngine) {
      audioEngine.destroy()
    }
    
    if (audioContext) {
      audioContext.close()
    }

    set({
      audioContext: null,
      audioEngine: null,
      isInitialized: false
    })
  }
}))