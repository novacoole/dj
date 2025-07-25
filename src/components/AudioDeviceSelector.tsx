import { useState, useEffect } from 'react'
import Button from './controls/Button'

interface AudioDevice {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

interface AudioDeviceSelectorProps {
  onDeviceSelect?: (deviceId: string) => void
  onClose?: () => void
}

const AudioDeviceSelector = ({ onDeviceSelect, onClose }: AudioDeviceSelectorProps) => {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('default')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadAudioDevices()
  }, [])

  const loadAudioDevices = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Request microphone permission to get device labels
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Get all audio devices
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const audioOutputs = deviceList
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Audio Output ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }))

      setDevices([
        { deviceId: 'default', label: 'Default Audio Output', kind: 'audiooutput' },
        ...audioOutputs
      ])
    } catch (err) {
      console.error('Failed to enumerate audio devices:', err)
      setError('Failed to access audio devices. Please check permissions.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeviceSelect = () => {
    onDeviceSelect?.(selectedDevice)
    onClose?.()
  }

  const testAudio = async () => {
    try {
      // Create a simple test tone
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4 note
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5) // Play for 0.5 seconds

      // Clean up
      setTimeout(() => {
        audioContext.close()
      }, 1000)
    } catch (error) {
      console.error('Failed to test audio:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-mixxx-dark rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Audio Device Setup</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-900 text-red-200 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading audio devices...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Select Audio Output Device:
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-mixxx-blue"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-400">
              <p className="mb-2">Note: Web browsers have limited audio device control.</p>
              <p>Most browsers will use your system's default audio output device.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={testAudio}>
                Test Audio
              </Button>
              <Button variant="primary" onClick={handleDeviceSelect}>
                Use Selected Device
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Audio Context State: {navigator.mediaDevices ? 'Supported' : 'Not Supported'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AudioDeviceSelector