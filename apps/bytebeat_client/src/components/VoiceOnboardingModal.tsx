import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VoiceStatus } from '../hooks/useElevenLabs'

interface Props {
  voiceStatus: VoiceStatus
  isReturning: boolean
  onEnable: () => void
  onSkip: () => void
}

export function VoiceOnboardingModal({ voiceStatus, isReturning, onEnable, onSkip }: Props) {
  const [clicked, setClicked] = useState(false)

  const isConnecting = clicked && (voiceStatus === 'connecting' || voiceStatus === 'idle')

  function handleEnable() {
    setClicked(true)
    onEnable()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(5,5,11,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        className="flex flex-col items-center gap-6 rounded-3xl p-10 mx-4"
        style={{
          background: 'linear-gradient(160deg, #141420 0%, #0d0d15 100%)',
          border: '1px solid rgba(167,139,250,0.2)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(167,139,250,0.08)',
          maxWidth: 380,
          width: '100%',
        }}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        {/* Mic orb */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute rounded-full"
            style={{ width: 88, height: 88, background: 'rgba(167,139,250,0.08)' }}
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 68, height: 68, background: 'rgba(167,139,250,0.12)' }}
            animate={{ scale: [1, 1.14, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <div
            className="relative w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #7ef4fb 100%)',
              boxShadow: '0 0 30px rgba(167,139,250,0.5)',
            }}
          >
            🎙
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-base font-bold tracking-wide" style={{ color: '#f3f4f6' }}>
            {isReturning ? "Let's Keep the Party Going" : 'Enable Voice for the Best Experience'}
          </h2>
          <p className="text-xs font-mono leading-relaxed" style={{ color: '#6b6b80' }}>
            {isReturning
              ? "Welcome back — your session is ready. Enable your mic and the DJ will pick up where you left off."
              : "Your AI DJ talks, listens, and generates sounds in real time. We'll need mic access to get started."}
          </p>
        </div>

        {/* Permission hint */}
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 w-full"
          style={{ background: '#0a0a14', border: '1px solid #1e1e2e' }}
        >
          <span style={{ color: '#a78bfa', fontSize: 14, marginTop: 1 }}>🔒</span>
          <p className="text-[11px] font-mono leading-relaxed" style={{ color: '#4a4a6a' }}>
            Your browser will ask for microphone permission. Audio is processed by ElevenLabs and never stored by ByteBeat.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <motion.button
            className="w-full py-3 rounded-2xl text-sm font-bold font-mono flex items-center justify-center gap-2"
            style={{
              background: isConnecting
                ? 'rgba(167,139,250,0.3)'
                : 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
              color: '#fff',
              boxShadow: isConnecting ? 'none' : '0 4px 20px rgba(167,139,250,0.35)',
            }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEnable}
            disabled={isConnecting}
          >
            <AnimatePresence mode="wait">
              {isConnecting ? (
                <motion.span
                  key="connecting"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  >
                    ◌
                  </motion.span>
                  Connecting...
                </motion.span>
              ) : (
                <motion.span
                  key="enable"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Enable Voice
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button
            className="w-full py-2 text-xs font-mono"
            style={{ color: '#3a3a5a' }}
            onClick={onSkip}
          >
            text only
          </button>
        </div>
      </motion.div>
    </div>
  )
}
