import { useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { PadGrid } from './components/PadGrid'
import { SoundModal } from './components/SoundModal'
import { AgentPanel } from './components/AgentPanel'
import { useAppStore } from './stores/useAppStore'

export default function App() {
  const initSession = useAppStore(s => s.initSession)

  useEffect(() => {
    initSession()
  }, [initSession])

  // Dynamic underglow reacts to whichever pad is currently active
  const activePadIds = useAppStore(s => s.activePadIds)
  const pads = useAppStore(s => s.pads)
  const activePad = pads.find(p => activePadIds.includes(p.id))
  const glowColor = activePad?.color ?? '#a78bfa'

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: '#09090e', color: '#c8c8d8' }}
    >
      {/* Ambient overhead spotlight — very subtle, premium feel */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '-25%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '80vh',
          background:
            'radial-gradient(ellipse at center top, rgba(167,139,250,0.07) 0%, rgba(126,244,251,0.03) 40%, transparent 68%)',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
      />

      <Toolbar />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <main className="flex-1 flex flex-col items-center justify-center gap-5 p-6">
          {/* Controller with reactive underglow */}
          <div className="relative flex items-center justify-center w-full" style={{ maxWidth: 'min(960px, calc(130vh - 390px))' }}>
            {/* Underglow beneath the controller */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '-28px',
                left: '8%',
                right: '8%',
                height: '55px',
                background: `radial-gradient(ellipse at center, ${glowColor}40 0%, ${glowColor}18 45%, transparent 72%)`,
                filter: 'blur(18px)',
                transition: 'background 0.35s ease',
                zIndex: 0,
              }}
            />
            <div className="relative z-10 w-full">
              <PadGrid />
            </div>
          </div>

          <p className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            click a pad to play · click + to assign a sound
          </p>
        </main>

        <AgentPanel />
      </div>

      <SoundModal />
    </div>
  )
}
