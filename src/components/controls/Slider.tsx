import { useState, useCallback, useRef } from 'react'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  orientation?: 'horizontal' | 'vertical'
  width?: number
  height?: number
  disabled?: boolean
  showValue?: boolean
}

const Slider = ({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  orientation = 'horizontal',
  width = 200,
  height = 20,
  disabled = false,
  showValue = false
}: SliderProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const normalizedValue = (value - min) / (max - min)
  
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return
    
    setIsDragging(true)
    updateValue(event)
    event.preventDefault()
  }, [disabled])

  const updateValue = useCallback((event: React.MouseEvent | MouseEvent) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    let ratio: number

    if (orientation === 'horizontal') {
      ratio = (event.clientX - rect.left) / rect.width
    } else {
      ratio = 1 - (event.clientY - rect.top) / rect.height // Inverted for vertical
    }

    ratio = Math.max(0, Math.min(1, ratio))
    let newValue = min + ratio * (max - min)

    // Apply step
    if (step > 0) {
      newValue = Math.round(newValue / step) * step
    }

    onChange(newValue)
  }, [min, max, step, orientation, onChange])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return
    updateValue(event)
  }, [isDragging, updateValue])

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

  const containerStyle = {
    width: orientation === 'horizontal' ? width : height,
    height: orientation === 'horizontal' ? height : height,
  }

  const trackStyle = {
    width: orientation === 'horizontal' ? '100%' : '8px',
    height: orientation === 'horizontal' ? '8px' : '100%',
  }

  const thumbSize = 16
  const thumbStyle = {
    width: thumbSize,
    height: thumbSize,
    position: 'absolute' as const,
    ...(orientation === 'horizontal' ? {
      left: `calc(${normalizedValue * 100}% - ${thumbSize / 2}px)`,
      top: '50%',
      transform: 'translateY(-50%)'
    } : {
      bottom: `calc(${normalizedValue * 100}% - ${thumbSize / 2}px)`,
      left: '50%',
      transform: 'translateX(-50%)'
    })
  }

  return (
    <div className="relative" style={containerStyle}>
      {/* Track */}
      <div
        ref={sliderRef}
        className={`slider-track relative cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={trackStyle}
        onMouseDown={handleMouseDown}
      >
        {/* Progress fill */}
        <div
          className="absolute bg-mixxx-blue rounded-full"
          style={{
            ...(orientation === 'horizontal' ? {
              width: `${normalizedValue * 100}%`,
              height: '100%',
              left: 0,
              top: 0
            } : {
              width: '100%',
              height: `${normalizedValue * 100}%`,
              left: 0,
              bottom: 0
            })
          }}
        />
      </div>

      {/* Thumb */}
      <div
        className={`slider-thumb ${
          isDragging ? 'brightness-125' : 'hover:brightness-110'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={thumbStyle}
      />

      {/* Value display */}
      {showValue && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
          {value.toFixed(2)}
        </div>
      )}
    </div>
  )
}

export default Slider