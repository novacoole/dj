import Slider from './controls/Slider'
import Knob from './controls/Knob'

interface MixerProps {
  crossfaderPosition: number
  onCrossfaderChange: (position: number) => void
}

const Mixer = ({ crossfaderPosition, onCrossfaderChange }: MixerProps) => {
  return (
    <div className="bg-mixxx-dark rounded-lg p-6 border border-gray-700">
      {/* Mixer Header */}
      <div className="text-center mb-6">
        <div className="text-sm text-gray-400 uppercase tracking-wide">
          Mixer
        </div>
      </div>

      {/* EQ Section */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Left Channel EQ */}
        <div className="space-y-4">
          <div className="text-xs text-gray-400 text-center">Left EQ</div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">HI</span>
              <Knob value={0.5} onChange={() => {}} size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">MID</span>
              <Knob value={0.5} onChange={() => {}} size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">LOW</span>
              <Knob value={0.5} onChange={() => {}} size="sm" />
            </div>
          </div>
        </div>

        {/* Right Channel EQ */}
        <div className="space-y-4">
          <div className="text-xs text-gray-400 text-center">Right EQ</div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">HI</span>
              <Knob value={0.5} onChange={() => {}} size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">MID</span>
              <Knob value={0.5} onChange={() => {}} size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">LOW</span>
              <Knob value={0.5} onChange={() => {}} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Channel Gains */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-400 mb-2">L GAIN</div>
          <Slider
            value={0.8}
            onChange={() => {}}
            orientation="vertical"
            height={120}
          />
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-400 mb-2">R GAIN</div>
          <Slider
            value={0.8}
            onChange={() => {}}
            orientation="vertical"
            height={120}
          />
        </div>
      </div>

      {/* Crossfader */}
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-2">CROSSFADER</div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>L</span>
            <span>CENTER</span>
            <span>R</span>
          </div>
          <Slider
            value={crossfaderPosition}
            onChange={onCrossfaderChange}
            min={-1}
            max={1}
            step={0.01}
            width={200}
          />
        </div>
      </div>

      {/* Master Section */}
      <div className="mt-8 pt-6 border-t border-gray-600">
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="text-xs text-gray-400 mb-2">MASTER</div>
            <Knob value={0.8} onChange={() => {}} />
          </div>
        </div>
      </div>

      {/* VU Meters */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-gray-400 text-center">L</div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-mixxx-green via-mixxx-yellow to-mixxx-red w-1/3 transition-all duration-100" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-400 text-center">R</div>
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-mixxx-green via-mixxx-yellow to-mixxx-red w-1/2 transition-all duration-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Mixer