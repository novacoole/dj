import { useState, useCallback, useRef } from 'react'

interface KnobProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  size?: 'sm' | 'md' | 'lg'
  center?: number
  disabled?: boolean
}

const Knob = ({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  size = 'md',
  center,
  disabled = false
}: KnobProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ y: 0, value: 0 })
  const knobRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  // Convert value to rotation angle (270 degrees of rotation)
  const normalizedValue = (value - min) / (max - min)
  const rotation = (normalizedValue * 270) - 135 // -135 to +135 degrees

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return
    
    setIsDragging(true)
    setDragStart({ y: event.clientY, value })
    event.preventDefault()
  }, [value, disabled])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return

    const sensitivity = 0.01
    const deltaY = dragStart.y - event.clientY
    const deltaValue = deltaY * sensitivity * (max - min)
    let newValue = dragStart.value + deltaValue

    // Snap to center if provided and close enough
    if (center !== undefined && Math.abs(newValue - center) < step * 3) {
      newValue = center
    }

    // Clamp to bounds
    newValue = Math.max(min, Math.min(max, newValue))
    
    // Apply step
    if (step > 0) {
      newValue = Math.round(newValue / step) * step
    }

    onChange(newValue)
  }, [isDragging, dragStart, min, max, step, center, onChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Global mouse events for dragging
  useState(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  })

  const handleDoubleClick = useCallback(() => {
    if (disabled) return
    
    // Reset to center value if provided, otherwise to middle of range
    const resetValue = center !== undefined ? center : (min + max) / 2
    onChange(resetValue)
  }, [center, min, max, onChange, disabled])

  return (
    <div
      ref={knobRef}
      className={`
        mixer-knob ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}
        ${isDragging ? 'brightness-125' : ''}
        transition-all duration-100
      `}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Knob indicator line */}
      <div 
        className="absolute w-0.5 h-3 bg-white rounded-full"
        style={{
          top: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 2px rgba(0,0,0,0.5)'
        }}
      />
      
      {/* Center dot when at center value */}
      {center !== undefined && Math.abs(value - center) < step && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-mixxx-blue rounded-full" />
        </div>
      )}
    </div>
  )
}

export default Knob