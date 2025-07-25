import { detectBPM } from '../utils/beatDetection'

export interface AudioBuffer {
  buffer: AudioBuffer
  duration: number
  sampleRate: number
}

export interface DeckState {
  isPlaying: boolean
  position: number // 0-1
  pitch: number // -1 to 1
  volume: number // 0-1
  bpm: number
  audioBuffer: AudioBuffer | null
  gainNode: GainNode | null
  sourceNode: AudioBufferSourceNode | null
  playbackRate: number
  startTime: number // When playback started
  startOffset: number // Position when playback started
  // Scratch control state (matching Mixxx)
  scratchPositionEnable: boolean // scratch_position_enable
  scratchPosition: number // scratch_position (normalized)
  scratchStartPosition: number // Initial position when scratch started
  scratchStartValue: number // Initial scratch_position value
  bufferSize: number // For Mixxx-style normalization
}

export class AudioEngine {
  private context: AudioContext
  private masterGain: GainNode
  private analyserNodes: Map<string, AnalyserNode> = new Map()
  private crossfaderGain: { left: GainNode; right: GainNode }
  
  public decks: Map<string, DeckState> = new Map()

  constructor(context: AudioContext) {
    this.context = context
    this.masterGain = context.createGain()
    this.masterGain.gain.value = 0.7 // Set reasonable master volume
    this.masterGain.connect(context.destination)

    // Create dual crossfader gains
    this.crossfaderGain = {
      left: context.createGain(),
      right: context.createGain()
    }
    
    this.crossfaderGain.left.connect(this.masterGain)
    this.crossfaderGain.right.connect(this.masterGain)

    // Initialize decks
    this.initializeDeck('left')
    this.initializeDeck('right')
  }

  private initializeDeck(deckId: string) {
    const gainNode = this.context.createGain()
    const analyserNode = this.context.createAnalyser()
    
    // Configure analyser for waveform visualization
    analyserNode.fftSize = 2048
    analyserNode.smoothingTimeConstant = 0.3
    
    // Connect audio graph: gain -> analyser -> crossfader
    gainNode.connect(analyserNode)
    analyserNode.connect(deckId === 'left' ? this.crossfaderGain.left : this.crossfaderGain.right)
    
    this.analyserNodes.set(deckId, analyserNode)
    
    this.decks.set(deckId, {
      isPlaying: false,
      position: 0,
      pitch: 0,
      volume: 0.8,
      bpm: 120,
      audioBuffer: null,
      gainNode,
      sourceNode: null,
      playbackRate: 1.0,
      startTime: 0,
      startOffset: 0,
      scratchPositionEnable: false,
      scratchPosition: 0,
      scratchStartPosition: 0,
      scratchStartValue: 0,
      bufferSize: 128 // Web Audio API default
    })
  }

  async loadTrack(deckId: string, file: File): Promise<void> {
    console.log(`Loading track for deck ${deckId}:`, file.name, file.type)
    
    try {
      // Ensure AudioContext is running
      if (this.context.state === 'suspended') {
        await this.context.resume()
        console.log('AudioContext resumed during track load')
      }

      const arrayBuffer = await file.arrayBuffer()
      console.log(`File loaded as ArrayBuffer: ${arrayBuffer.byteLength} bytes`)
      
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer)
      console.log(`Audio decoded:`, {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length
      })
      
      const deck = this.decks.get(deckId)
      if (!deck) throw new Error(`Deck ${deckId} not found`)

      // Stop current playback if any
      this.stop(deckId)

      deck.audioBuffer = {
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate
      }

      // Simple BPM estimation for now (to avoid complex detection blocking)
      deck.bpm = 120 + Math.random() * 60
      
      console.log(`Track loaded successfully for deck ${deckId}`)
    } catch (error) {
      console.error(`Failed to load track for deck ${deckId}:`, error)
      throw error
    }
  }

  async play(deckId: string, startTime?: number) {
    const deck = this.decks.get(deckId)
    if (!deck?.audioBuffer) {
      console.warn(`No audio buffer for deck ${deckId}`)
      return
    }

    // Ensure AudioContext is running
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }
    
    // Update buffer size (Web Audio API uses power of 2, typically 128-4096)
    // This is used for Mixxx-style normalization
    deck.bufferSize = 128 // Web Audio typical buffer size

    // Stop current source if playing
    if (deck.sourceNode) {
      try {
        deck.sourceNode.stop()
      } catch (e) {
        // Source might already be stopped
      }
      deck.sourceNode = null
    }

    // Create new source
    const source = this.context.createBufferSource()
    source.buffer = deck.audioBuffer.buffer
    source.playbackRate.value = deck.playbackRate
    
    // Connect audio graph properly
    source.connect(deck.gainNode!)

    // Handle playback end
    source.onended = () => {
      if (deck.sourceNode === source) {
        deck.isPlaying = false
        deck.sourceNode = null
        console.log(`Playback ended for deck ${deckId}`)
      }
    }

    const offset = startTime || deck.position * deck.audioBuffer.duration
    console.log(`Starting playback for deck ${deckId} at offset ${offset}s`)
    
    try {
      source.start(0, offset)
      deck.sourceNode = source
      deck.isPlaying = true
      deck.startTime = this.context.currentTime
      deck.startOffset = offset / deck.audioBuffer.duration // Store as 0-1 position
      
      console.log(`Deck ${deckId} playing:`, {
        duration: deck.audioBuffer.duration,
        volume: deck.volume,
        playbackRate: deck.playbackRate,
        startOffset: deck.startOffset
      })
    } catch (error) {
      console.error(`Failed to start playback for deck ${deckId}:`, error)
    }
  }

  stop(deckId: string) {
    const deck = this.decks.get(deckId)
    if (!deck) return

    if (deck.sourceNode) {
      deck.sourceNode.stop()
      deck.sourceNode = null
    }
    deck.isPlaying = false
  }

  pause(deckId: string) {
    // Web Audio doesn't have native pause, so we stop and remember position
    const deck = this.decks.get(deckId)
    if (!deck?.isPlaying) return

    // Calculate current position based on playback time
    // This is a simplified version - real implementation would track more precisely
    this.stop(deckId)
  }

  setPitch(deckId: string, pitch: number) {
    const deck = this.decks.get(deckId)
    if (!deck) return

    deck.pitch = Math.max(-1, Math.min(1, pitch))
    // Convert pitch to playback rate (typical DJ range: ±8%)
    deck.playbackRate = 1 + (deck.pitch * 0.08)
    
    if (deck.sourceNode) {
      deck.sourceNode.playbackRate.value = deck.playbackRate
    }
  }

  setVolume(deckId: string, volume: number) {
    const deck = this.decks.get(deckId)
    if (!deck?.gainNode) return

    deck.volume = Math.max(0, Math.min(1, volume))
    deck.gainNode.gain.value = deck.volume
  }

  setCrossfader(position: number) {
    // Position: -1 (full left) to 1 (full right)
    const normalizedPos = (position + 1) / 2 // Convert to 0-1

    // Equal power crossfade curve
    const leftGain = Math.cos(normalizedPos * Math.PI / 2)
    const rightGain = Math.sin(normalizedPos * Math.PI / 2)

    this.crossfaderGain.left.gain.value = leftGain
    this.crossfaderGain.right.gain.value = rightGain
  }

  // Enable scratch mode (like setting scratch_position_enable to 1)
  enableScratch(deckId: string) {
    const deck = this.decks.get(deckId)
    if (!deck || !deck.audioBuffer) return
    
    // Get current position in samples (stereo)
    const currentPosSamples = deck.position * deck.audioBuffer.duration * deck.audioBuffer.sampleRate * 2
    
    deck.scratchPositionEnable = true
    deck.scratchPosition = 0 // Reset to 0 like Mixxx
    deck.scratchStartPosition = currentPosSamples
    deck.scratchStartValue = this.context.currentTime // Track time for rate calculation
    
    console.log(`Scratch enabled for deck ${deckId} at position ${currentPosSamples} samples`)
  }
  
  // Helper to convert any control movement to scratch samples
  // This ensures platter and waveform use identical logic
  scratchByAngle(deckId: string, angleDelta: number) {
    const deck = this.decks.get(deckId)
    if (!deck?.audioBuffer || !deck.scratchPositionEnable) return
    
    // Convert angle to samples (33 RPM standard)
    const rotations = angleDelta / 360
    const secondsPerRotation = 60 / 33  // 1.818 seconds at 33 RPM
    const timeDelta = rotations * secondsPerRotation
    const sampleDelta = timeDelta * deck.audioBuffer.sampleRate * 2 // *2 for stereo
    
    // Normalize exactly like Mixxx: by (bufferSize * baseSampleRate)
    const normalizedDelta = sampleDelta / (deck.bufferSize * deck.audioBuffer.sampleRate)
    
    this.setScratchPosition(deckId, normalizedDelta)
  }
  
  // Helper for waveform dragging - converts position delta to scratch
  scratchByPosition(deckId: string, targetPosition: number) {
    const deck = this.decks.get(deckId)
    if (!deck?.audioBuffer || !deck.scratchPositionEnable) return
    
    // Convert target position to samples from scratch start
    const targetSamples = targetPosition * deck.audioBuffer.duration * deck.audioBuffer.sampleRate * 2 // *2 for stereo
    const deltaSamples = targetSamples - deck.scratchStartPosition
    
    // Normalize exactly like Mixxx: by (bufferSize * baseSampleRate)
    const normalizedDelta = deltaSamples / (deck.bufferSize * deck.audioBuffer.sampleRate)
    
    this.setScratchPosition(deckId, normalizedDelta)
  }
  
  // Disable scratch mode
  disableScratch(deckId: string) {
    const deck = this.decks.get(deckId)
    if (!deck) return
    
    deck.scratchPositionEnable = false
    
    // Reset playback rate to normal (with pitch adjustment)
    if (deck.sourceNode) {
      deck.sourceNode.playbackRate.value = deck.playbackRate
    }
    
    console.log(`Scratch disabled for deck ${deckId}`)
  }
  
  // Set scratch position (normalized like Mixxx)
  setScratchPosition(deckId: string, normalizedDelta: number) {
    const deck = this.decks.get(deckId)
    if (!deck || !deck.scratchPositionEnable || !deck.audioBuffer) return
    
    const currentTime = this.context.currentTime
    const timeDelta = currentTime - deck.scratchStartValue
    
    // Only process if enough time has passed
    if (timeDelta < 0.008) return // ~120fps max
    
    // Calculate rate from normalized position change
    const lastPosition = deck.scratchPosition
    const positionDelta = normalizedDelta - lastPosition
    
    // Mixxx calculates rate from the normalized delta
    // The normalization already accounts for buffer size and sample rate
    const scratchSpeed = positionDelta / timeDelta
    
    // Apply the rate to the audio source
    if (deck.sourceNode && deck.isPlaying) {
      // Add base playback rate
      const targetRate = deck.playbackRate + scratchSpeed
      
      // Clamp to reasonable bounds
      const clampedRate = Math.max(0.0, Math.min(4.0, targetRate))
      
      // Apply smoothly
      deck.sourceNode.playbackRate.value = clampedRate
      
      if (Math.abs(scratchSpeed) > 0.01) {
        console.log(`Scratch: delta=${positionDelta.toFixed(4)} normalized, speed=${scratchSpeed.toFixed(2)}x, rate=${clampedRate.toFixed(2)}x`)
      }
    }
    
    // Update tracking
    deck.scratchPosition = normalizedDelta
    deck.scratchStartValue = currentTime
    
    // Also update visual position
    // Un-normalize to get back to sample position
    const deltaSamples = normalizedDelta * deck.bufferSize * deck.audioBuffer.sampleRate
    const targetPosSamples = deck.scratchStartPosition + deltaSamples
    const targetPosNormalized = targetPosSamples / (deck.audioBuffer.duration * deck.audioBuffer.sampleRate * 2)
    deck.position = Math.max(0, Math.min(1, targetPosNormalized))
  }

  setPosition(deckId: string, position: number) {
    const deck = this.decks.get(deckId)
    if (!deck) return

    const wasPlaying = deck.isPlaying
    deck.position = Math.max(0, Math.min(1, position))
    
    // During scratching, don't restart - rate control handles it
    if (deck.scratchPositionEnable) {
      return
    }
    
    // Normal seeking: restart audio at new position
    if (wasPlaying && deck.audioBuffer) {
      // Stop current playback
      if (deck.sourceNode) {
        try {
          deck.sourceNode.stop()
        } catch (e) {
          // Source might already be stopped
        }
        deck.sourceNode = null
      }
      
      // Restart at new position
      this.play(deckId, deck.position * deck.audioBuffer.duration)
    }
  }

  getAnalyserData(deckId: string): Uint8Array | null {
    const analyser = this.analyserNodes.get(deckId)
    if (!analyser) return null

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    return dataArray
  }

  getWaveformData(deckId: string): Float32Array | null {
    const analyser = this.analyserNodes.get(deckId)
    if (!analyser) return null

    const dataArray = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(dataArray)
    return dataArray
  }

  // Update playback position based on current time
  updatePosition(deckId: string) {
    const deck = this.decks.get(deckId)
    if (!deck || !deck.isPlaying || !deck.audioBuffer) return

    // During scratch mode, position is updated by setScratchPosition
    if (deck.scratchPositionEnable) {
      // But we still need to track elapsed time for non-scratching position
      const currentTime = this.context.currentTime
      const elapsedTime = currentTime - deck.startTime
      const rate = deck.sourceNode?.playbackRate.value || deck.playbackRate
      const positionChange = (elapsedTime * rate) / deck.audioBuffer.duration
      deck.position = Math.min(1, deck.startOffset + positionChange)
      return
    }

    const currentTime = this.context.currentTime
    const elapsedTime = currentTime - deck.startTime
    const positionChange = (elapsedTime * deck.playbackRate) / deck.audioBuffer.duration
    
    deck.position = Math.min(1, deck.startOffset + positionChange)
    
    // Stop if we've reached the end
    if (deck.position >= 1) {
      this.stop(deckId)
      deck.position = 1
    }
  }

  // Get current position (call this regularly to update position)
  getCurrentPosition(deckId: string): number {
    this.updatePosition(deckId)
    return this.decks.get(deckId)?.position || 0
  }


  destroy() {
    this.decks.forEach((_, deckId) => this.stop(deckId))
    this.context.close()
  }
}