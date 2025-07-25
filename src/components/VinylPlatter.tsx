import { useEffect, useState } from 'react'

interface VinylPlatterProps {
  isPlaying: boolean
  size?: number
  onScratch?: (delta: number) => void
  onSeek?: (position: number) => void
  onScratchStart?: () => void
  onScratchEnd?: () => void
}

const VinylPlatter = ({ 
  isPlaying, 
  size = 200, 
  onScratch,
  onSeek,
  onScratchStart,
  onScratchEnd
}: VinylPlatterProps) => {
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouseAngle, setLastMouseAngle] = useState(0)
  const [fullRotations, setFullRotations] = useState(0)
  const [initialAngle, setInitialAngle] = useState(0)

  // Continuous rotation when playing
  useEffect(() => {
    if (!isPlaying || isDragging) return

    const interval = setInterval(() => {
      setRotation(prev => prev + 1) // Let rotation accumulate without reset
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [isPlaying, isDragging])

  const getMouseAngle = (event: React.MouseEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = event.clientX - centerX
    const deltaY = event.clientY - centerY
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI)
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    const angle = getMouseAngle(event, element)
    setLastMouseAngle(angle)
    setFullRotations(0) // Reset rotations when starting new scratch
    setInitialAngle(angle) // Just store the initial angle
    setIsDragging(true)
    onScratchStart?.() // Enter scratch mode
    event.preventDefault()
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return

    const element = event.currentTarget as HTMLElement
    const currentAngle = getMouseAngle(event, element)
    
    // Handle angle wrap-around like Mixxx
    if (lastMouseAngle > 100 && currentAngle < 0) {
      setFullRotations(prev => prev + 1)
    } else if (lastMouseAngle < -100 && currentAngle > 0) {
      setFullRotations(prev => prev - 1)
    }
    
    setLastMouseAngle(currentAngle)
    
    // Calculate total angle including full rotations
    const totalAngle = currentAngle + fullRotations * 360
    const angleDelta = totalAngle - initialAngle
    
    // Visual rotation
    setRotation(totalAngle)
    
    // Convert angle to sample delta like Mixxx
    // This is the key: we're tracking absolute angle from start, not incremental
    onScratch?.(angleDelta)
  }

  const handleMouseUp = () => {
    if (isDragging) {
      onScratchEnd?.() // Exit scratch mode
    }
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      onScratchEnd?.() // Exit scratch mode
    }
    setIsDragging(false)
  }

  return (
    <div 
      className="vinyl-platter cursor-pointer select-none"
      style={{ 
        width: size, 
        height: size,
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3)'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Vinyl Record */}
      <div 
        className="vinyl-record transition-transform duration-100"
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* Center Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-mixxx-blue rounded-full flex items-center justify-center shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Tone Arm Indicator */}
        <div 
          className="absolute w-1 bg-mixxx-yellow opacity-60"
          style={{
            height: size * 0.3,
            left: '50%',
            top: '10%',
            transformOrigin: 'bottom center',
            transform: 'translateX(-50%)'
          }}
        />

        {/* Groove Lines */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-white opacity-10"
            style={{
              margin: `${20 + i * 15}px`,
            }}
          />
        ))}
      </div>

      {/* Platter Markings */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-4 bg-white opacity-30"
          style={{
            left: '50%',
            top: '4px',
            transformOrigin: `center ${size / 2 - 4}px`,
            transform: `translateX(-50%) rotate(${i * 30}deg)`
          }}
        />
      ))}

      {/* Status Indicator */}
      <div className="absolute bottom-2 right-2">
        <div className={`w-3 h-3 rounded-full ${
          isPlaying ? 'bg-mixxx-green animate-pulse' : 'bg-gray-500'
        }`} />
      </div>
    </div>
  )
}

export default VinylPlatter