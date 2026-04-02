import { useAppStore } from '../stores/useAppStore'
import { Pad } from './Pad'

// Decorative rotary knob with arc ring indicator
function Knob({ label, color, value = 0.65 }: { label: string; color: string; value?: number }) {
  const indicatorDeg = -135 + value * 270
  // Arc spans 270°. value * 75% fills that portion of the conic gradient.
  const arcFill = value * 75

  return (
    <div className="flex flex-col items-center gap-[7px]">
      <div
        className="relative w-12 h-12 rounded-full"
        style={{
          background: 'linear-gradient(145deg, #222230 0%, #0d0d14 100%)',
          boxShadow: `0 5px 12px rgba(0,0,0,0.88), 0 1px 3px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.55)`,
        }}
      >
        {/* Conic ring indicator arc */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-2.5px',
            background: `conic-gradient(from -135deg, ${color} 0% ${arcFill}%, rgba(255,255,255,0.06) ${arcFill}% 75%, transparent 75%)`,
            WebkitMask: 'radial-gradient(circle at center, transparent 55%, black 55%)',
            mask: 'radial-gradient(circle at center, transparent 55%, black 55%)',
          }}
        />
        {/* Glow ring overlay */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-2.5px',
            background: `conic-gradient(from -135deg, ${color}66 0% ${arcFill}%, transparent ${arcFill}% 100%)`,
            WebkitMask: 'radial-gradient(circle at center, transparent 52%, black 52%)',
            mask: 'radial-gradient(circle at center, transparent 52%, black 52%)',
            filter: `blur(3px)`,
          }}
        />
        {/* Indicator line */}
        <div
          className="absolute inset-0"
          style={{ transform: `rotate(${indicatorDeg}deg)` }}
        >
          <div
            className="absolute left-1/2 top-[13%] -translate-x-1/2 w-[2px] h-[28%] rounded-full"
            style={{
              background: 'rgba(255,255,255,0.88)',
              boxShadow: '0 0 3px rgba(255,255,255,0.4)',
            }}
          />
        </div>
      </div>

      <span
        className="text-[9px] font-mono tracking-[0.15em] uppercase"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        {label}
      </span>
    </div>
  )
}

export function PadGrid() {
  const pads = useAppStore(s => s.pads)
  const activePadIds = useAppStore(s => s.activePadIds)
  const triggerPad = useAppStore(s => s.triggerPad)
  const setEditingPad = useAppStore(s => s.setEditingPad)
  const selectingSound = useAppStore(s => s.selectingSound)
  const setPadSound = useAppStore(s => s.setPadSound)
  const setSelectingSound = useAppStore(s => s.setSelectingSound)

  return (
    <div
      className="relative flex flex-col gap-5 rounded-[36px] p-8"
      style={{
        background: 'linear-gradient(160deg, #1c1c27 0%, #111118 55%, #151520 100%)',
        boxShadow:
          '0 70px 140px rgba(0,0,0,0.96), 0 35px 70px rgba(0,0,0,0.75), 0 10px 30px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.05)',
        width: '100%',
      }}
    >
      {/* Top strip: model badge + bank selectors */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div
            className="w-[7px] h-[7px] rounded-full"
            style={{
              background: '#a78bfa',
              boxShadow: '0 0 8px #a78bfa, 0 0 16px #a78bfa66',
            }}
          />
          <span
            className="text-[11px] font-mono tracking-[0.22em] uppercase"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            ByteBeat MK1
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-mono tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Bank
          </span>
          <div className="flex gap-2">
            {['A', 'B', 'C', 'D'].map((b, i) => (
              <div key={b} className="flex flex-col items-center gap-[5px]">
                <div
                  className="w-5 h-[3px] rounded-full"
                  style={{
                    background: i === 0 ? '#a78bfa' : 'rgba(255,255,255,0.07)',
                    boxShadow: i === 0 ? '0 0 6px #a78bfa99' : 'none',
                  }}
                />
                <span
                  className="text-[10px] font-mono font-bold"
                  style={{
                    color: i === 0 ? 'rgba(196,181,253,0.95)' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4×4 pad grid */}
      <div className="grid grid-cols-4 gap-5">
        {pads.map(pad => (
          <Pad
            key={pad.id}
            pad={pad}
            isActive={activePadIds.includes(pad.id)}
            isSelecting={!!selectingSound}
            onTrigger={() => triggerPad(pad.id)}
            onEdit={() => setEditingPad(pad.id)}
            onSelect={() => {
              if (selectingSound) {
                setPadSound(pad.id, selectingSound)
                setSelectingSound(null)
              }
            }}
          />
        ))}
      </div>

      {/* Bottom controls: knobs + mini sliders */}
      <div className="flex items-end justify-between px-0.5">
        {/* Rotary knobs */}
        <div className="flex items-end gap-6">
          <Knob label="Volume" color="#c4b5fd" value={0.75} />
          <Knob label="Reverb" color="#7ef4fb" value={0.38} />
          <Knob label="Delay"  color="#86efac" value={0.28} />
          <Knob label="Filter" color="#ffb3c6" value={0.62} />
        </div>

        {/* Mini fader strips */}
        <div className="flex flex-col gap-2.5 items-end">
          {[
            { label: 'Vel', width: '78%', color1: '#c4b5fd', color2: '#7ef4fb' },
            { label: 'Swg', width: '44%', color1: '#86efac', color2: '#7ef4fb' },
          ].map(({ label, width, color1, color2 }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {label}
              </span>
              <div
                className="relative w-16 h-[5px] rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width,
                    background: `linear-gradient(to right, ${color1}, ${color2})`,
                    boxShadow: `0 0 6px ${color1}88`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
