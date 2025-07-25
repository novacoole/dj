import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface DeckStateStore {
  leftDeck: {
    isPlaying: boolean
    position: number
    volume: number
    pitch: number
    bpm: number
    trackName: string
    duration: number
  }
  rightDeck: {
    isPlaying: boolean
    position: number
    volume: number
    pitch: number
    bpm: number
    trackName: string
    duration: number
  }
  
  // Actions
  updateDeck: (deckId: 'leftDeck' | 'rightDeck', updates: Partial<DeckStateStore['leftDeck']>) => void
  setPosition: (deckId: 'leftDeck' | 'rightDeck', position: number) => void
  setPlaying: (deckId: 'leftDeck' | 'rightDeck', playing: boolean) => void
}

const initialDeckState = {
  isPlaying: false,
  position: 0,
  volume: 0.8,
  pitch: 0,
  bpm: 120,
  trackName: '',
  duration: 0
}

export const useDeckState = create<DeckStateStore>()(
  subscribeWithSelector((set) => ({
    leftDeck: { ...initialDeckState },
    rightDeck: { ...initialDeckState },

    updateDeck: (deckId, updates) =>
      set((state) => ({
        [deckId]: { ...state[deckId], ...updates }
      })),

    setPosition: (deckId, position) =>
      set((state) => ({
        [deckId]: { ...state[deckId], position }
      })),

    setPlaying: (deckId, playing) =>
      set((state) => ({
        [deckId]: { ...state[deckId], isPlaying: playing }
      }))
  }))
)