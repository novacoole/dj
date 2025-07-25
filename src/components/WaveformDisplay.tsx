import { useEffect, useRef, useState, useCallback } from 'react'
import { useAudioEngine } from '../hooks/useAudioEngine'

interface WaveformDisplayProps {
  deckId: string
  width?: number
  height?: number
}

const WaveformDisplay = ({ 
  deckId, 
  width = 600, 
  height = 100 
}: WaveformDisplayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { audioEngine } = useAudioEngine()
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null)
  const [maxAmplitude, setMaxAmplitude] = useState<number>(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartPosition, setDragStartPosition] = useState(0)
  const animationRef = useRef<number>()

  // Generate waveform from audio buffer
  const generateWaveform = useCallback((audioBuffer: AudioBuffer, samples = 2048) => {
    console.log('Generating waveform from audio buffer:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      length: audioBuffer.length
    })

    const rawData = audioBuffer.getChannelData(0) // Use left channel
    const blockSize = Math.floor(rawData.length / samples)
    const waveform = new Float32Array(samples)

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize
      const end = start + blockSize
      let sum = 0
      
      for (let j = start; j < end && j < rawData.length; j++) {
        sum += Math.abs(rawData[j])
      }
      
      waveform[i] = blockSize > 0 ? sum / blockSize : 0
    }

    const maxValue = Math.max(...waveform)
    console.log('Waveform data generated:', {
      samples: waveform.length,
      maxValue,
      minValue: Math.min(...waveform)
    })

    return { waveform, maxAmplitude: maxValue }
  }, [])

  // Update waveform when track loads
  useEffect(() => {
    if (!audioEngine) return

    const checkForAudio = () => {
      const deck = audioEngine.decks.get(deckId)
      if (deck?.audioBuffer && !waveformData) { // Only generate if we don't have waveform data yet
        console.log(`Generating waveform for deck ${deckId}`)
        const result = generateWaveform(deck.audioBuffer.buffer)
        setWaveformData(result.waveform)
        setMaxAmplitude(result.maxAmplitude)
        console.log(`Waveform generated: ${result.waveform.length} samples, max: ${result.maxAmplitude}`)
      }
    }

    // Check immediately
    checkForAudio()

    // Also check periodically in case audio loads later, but less frequently
    const interval = setInterval(checkForAudio, 5000) // Every 5 seconds instead of 1
    return () => clearInterval(interval)
  }, [audioEngine, deckId, generateWaveform, waveformData]) // Add waveformData dependency

  // Render waveform with scrolling
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size properly
    canvas.width = width
    canvas.height = height

    // Clear canvas with background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)

    if (!waveformData) {
      // Draw placeholder
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(0, height / 2 - 1, width, 2)
      return
    }

    // Get current deck state with real-time position
    const deck = audioEngine?.decks.get(deckId)
    const isPlaying = deck?.isPlaying || false
    const position = audioEngine?.getCurrentPosition(deckId) || 0

    // Calculate visible window (much more zoomed in)
    const windowSize = 0.05 // Show only 5% of track on each side (10% total)
    const startPos = Math.max(0, position - windowSize)
    const endPos = Math.min(1, position + windowSize)
    
    // Convert to sample indices
    const startSample = Math.floor(startPos * waveformData.length)
    const endSample = Math.ceil(endPos * waveformData.length)
    const visibleSamples = endSample - startSample
    
    const centerY = height / 2
    const playheadX = width / 2 // Fixed playhead at center

    // Draw visible waveform section
    for (let i = 0; i < visibleSamples; i++) {
      const sampleIndex = startSample + i
      if (sampleIndex >= waveformData.length) break

      const amplitude = waveformData[sampleIndex]
      // Normalize to maxAmplitude so loudest part touches top/bottom
      const normalizedAmplitude = maxAmplitude > 0 ? amplitude / maxAmplitude : 0
      const barHeight = Math.max(1, normalizedAmplitude * centerY * 0.9) // Use 90% of available height
      const x = (i / visibleSamples) * width

      // Color based on position relative to playhead
      const distanceFromPlayhead = Math.abs(x - playheadX) / (width / 2)
      const alpha = Math.max(0.3, 1 - distanceFromPlayhead * 0.5)
      
      // Different colors for past and future
      const relativePos = (sampleIndex / waveformData.length)
      let color: string
      
      if (relativePos < position) {
        // Past: dimmer blue
        color = `rgba(0, 180, 216, ${alpha * 0.6})`
      } else if (Math.abs(relativePos - position) < 0.01) {
        // Current: bright green
        color = `rgba(0, 255, 0, ${alpha})`
      } else {
        // Future: bright blue
        color = `rgba(0, 180, 216, ${alpha})`
      }

      ctx.fillStyle = color
      
      // Draw positive amplitude
      ctx.fillRect(x, centerY - barHeight, Math.max(1, width / visibleSamples * 0.8), barHeight)
      // Draw negative amplitude (mirrored)
      ctx.fillRect(x, centerY, Math.max(1, width / visibleSamples * 0.8), barHeight)
    }

    // Draw fixed playback line at center
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, height)
    ctx.stroke()

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(width, centerY)
    ctx.stroke()

    // Draw position indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '12px monospace'
    const timeText = `${(position * 100).toFixed(1)}%`
    ctx.fillText(timeText, 10, 20)
  }, [waveformData, maxAmplitude, width, height, audioEngine, deckId])

  // Handle mouse down to start dragging
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioEngine || !waveformData) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const currentPosition = audioEngine.getCurrentPosition(deckId) || 0

    setIsDragging(true)
    setDragStartX(mouseX)
    setDragStartPosition(currentPosition)
    
    // Enter scratch mode for smooth waveform scrubbing
    audioEngine.enableScratch(deckId)
    
    // Prevent default to avoid text selection
    event.preventDefault()
  }, [audioEngine, deckId, waveformData])

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !audioEngine || !waveformData) return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const deck = audioEngine.decks.get(deckId)
    if (!deck?.audioBuffer) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const deltaX = mouseX - dragStartX

    // Calculate position delta with reduced sensitivity
    const windowSize = 0.05 // Must match the zoom level above
    const totalVisibleTime = windowSize * 2 // Total window is 2 * windowSize
    const dragRatio = deltaX / width
    const sensitivity = 0.5 // Reduce sensitivity for more control
    const positionDelta = dragRatio * totalVisibleTime * sensitivity

    // Calculate new position (opposite direction for natural feel)
    const targetPosition = dragStartPosition - positionDelta
    const clampedPosition = Math.max(0, Math.min(1, targetPosition))
    
    // Use the shared scratch logic
    audioEngine.scratchByPosition(deckId, clampedPosition)
  }, [isDragging, audioEngine, deckId, waveformData, dragStartX, dragStartPosition, width])

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (isDragging && audioEngine) {
      // Exit scratch mode
      audioEngine.disableScratch(deckId)
    }
    setIsDragging(false)
  }, [isDragging, audioEngine, deckId])

  // Handle mouse leave to end dragging
  const handleMouseLeave = useCallback(() => {
    if (isDragging && audioEngine) {
      // Exit scratch mode
      audioEngine.disableScratch(deckId)
    }
    setIsDragging(false)
  }, [isDragging, audioEngine, deckId])

  // Initial render and when data changes
  useEffect(() => {
    renderWaveform()
  }, [renderWaveform])

  // Animation loop for real-time updates (lighter weight)
  useEffect(() => {
    if (!waveformData) return

    const animate = () => {
      renderWaveform()
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [waveformData, renderWaveform])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`bg-mixxx-darker rounded border border-gray-700 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ width, height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      
      {!waveformData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Load a track to see waveform</span>
        </div>
      )}
      
      {/* Waveform overlays */}
      <div className="absolute top-1 left-2 text-xs text-gray-400">
        {deckId.toUpperCase()}
      </div>
      
      {waveformData && (
        <div className="absolute top-1 right-2 text-xs text-gray-400">
          {Math.round(waveformData.length)} samples
        </div>
      )}
    </div>
  )
}

export default WaveformDisplay