export interface BeatInfo {
  bpm: number
  beats: number[] // Beat positions in seconds
  confidence: number // 0-1
}

export class BeatDetector {
  private sampleRate: number
  private windowSize: number
  private hopSize: number

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate
    this.windowSize = 1024
    this.hopSize = this.windowSize / 4
  }

  // Simplified beat detection algorithm
  detectBeats(audioBuffer: AudioBuffer): BeatInfo {
    const channelData = audioBuffer.getChannelData(0)
    const duration = audioBuffer.duration
    
    // Calculate onset detection function
    const onsets = this.detectOnsets(channelData)
    
    // Estimate tempo from onset intervals
    const bpm = this.estimateTempo(onsets, duration)
    
    // Generate beat grid based on estimated BPM
    const beats = this.generateBeatGrid(bpm, duration)
    
    return {
      bpm,
      beats,
      confidence: 0.8 // Simplified confidence score
    }
  }

  private detectOnsets(audioData: Float32Array): number[] {
    const onsets: number[] = []
    const frameSize = this.windowSize
    const hopSize = this.hopSize
    
    // Simple spectral flux onset detection
    let previousSpectrum: Float32Array | null = null
    
    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize)
      const spectrum = this.getSpectrum(frame)
      
      if (previousSpectrum) {
        const flux = this.calculateSpectralFlux(spectrum, previousSpectrum)
        
        // Onset threshold (simplified)
        if (flux > 0.1) {
          const timeSeconds = i / this.sampleRate
          onsets.push(timeSeconds)
        }
      }
      
      previousSpectrum = spectrum
    }
    
    return onsets
  }

  private getSpectrum(frame: Float32Array): Float32Array {
    // Simplified FFT - in real implementation you'd use a proper FFT library
    // For now, just return energy in frequency bands
    const spectrum = new Float32Array(frame.length / 2)
    
    for (let i = 0; i < spectrum.length; i++) {
      const real = frame[i * 2] || 0
      const imag = frame[i * 2 + 1] || 0
      spectrum[i] = Math.sqrt(real * real + imag * imag)
    }
    
    return spectrum
  }

  private calculateSpectralFlux(current: Float32Array, previous: Float32Array): number {
    let flux = 0
    
    for (let i = 0; i < Math.min(current.length, previous.length); i++) {
      const diff = current[i] - previous[i]
      if (diff > 0) {
        flux += diff
      }
    }
    
    return flux / current.length
  }

  private estimateTempo(onsets: number[], duration: number): number {
    if (onsets.length < 2) return 120 // Default BPM
    
    // Calculate intervals between onsets
    const intervals: number[] = []
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1])
    }
    
    // Find most common interval (simplified tempo estimation)
    const histogram: { [key: string]: number } = {}
    
    intervals.forEach(interval => {
      const roundedInterval = Math.round(interval * 10) / 10 // Round to 0.1s
      histogram[roundedInterval] = (histogram[roundedInterval] || 0) + 1
    })
    
    // Find most frequent interval
    let maxCount = 0
    let dominantInterval = 0.5 // Default to 120 BPM
    
    Object.entries(histogram).forEach(([interval, count]) => {
      if (count > maxCount) {
        maxCount = count
        dominantInterval = parseFloat(interval)
      }
    })
    
    // Convert interval to BPM
    const bpm = 60 / dominantInterval
    
    // Clamp to reasonable range
    return Math.max(60, Math.min(200, bpm))
  }

  private generateBeatGrid(bpm: number, duration: number): number[] {
    const beats: number[] = []
    const beatInterval = 60 / bpm // Seconds per beat
    
    for (let time = 0; time < duration; time += beatInterval) {
      beats.push(time)
    }
    
    return beats
  }
}

// Helper function to detect BPM from audio file
export async function detectBPM(audioBuffer: AudioBuffer): Promise<BeatInfo> {
  const detector = new BeatDetector(audioBuffer.sampleRate)
  return detector.detectBeats(audioBuffer)
}