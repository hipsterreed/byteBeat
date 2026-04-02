import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/useAppStore'
import { sendAgentMessage } from '../lib/api'
import { useElevenLabs } from '../hooks/useElevenLabs'
import { VoiceOnboardingModal } from './VoiceOnboardingModal'
import { previewSound } from '../lib/audioEngine'
import { analytics } from '../lib/analytics'
import type { Sound } from '../types'

const STATUS_LABEL: Record<string, string> = {
  idle: 'voice off',
  connecting: 'connecting...',
  listening: 'listening',
  speaking: 'speaking',
  error: 'mic error',
}

const STATUS_COLOR: Record<string, string> = {
  idle: '#3a3a5a',
  connecting: '#facc15',
  listening: '#4ade80',
  speaking: '#a78bfa',
  error: '#f87171',
}

function SoundCard({ sound }: { sound: Sound }) {
  const pads = useAppStore(s => s.pads)
  const selectingSound = useAppStore(s => s.selectingSound)
  const setSelectingSound = useAppStore(s => s.setSelectingSound)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isThisSelecting = selectingSound?.id === sound.id
  const isAssigned = pads.some(p => p.soundId === sound.id)

  function togglePreview() {
    if (!audioRef.current) {
      audioRef.current = new Audio(sound.url)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  function pickPad() {
    if (isThisSelecting) {
      setSelectingSound(null)
    } else {
      setSelectingSound(sound)
    }
  }

  const allPadsFull = pads.every(p => p.soundId)

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2 mt-1"
      style={{ background: '#12121f', border: '1px solid #a78bfa33' }}
    >
      <div className="flex items-center gap-2">
        <motion.button
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
          style={{ background: '#a78bfa22', color: '#a78bfa', border: '1px solid #a78bfa44' }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePreview}
        >
          {playing ? '⏹' : '▶'}
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono truncate" style={{ color: '#e2d9f3' }}>
            {sound.name}
          </div>
          <div className="text-[10px] font-mono truncate" style={{ color: '#6b6b80' }}>
            {sound.category}
          </div>
        </div>
      </div>

      {/* Waveform placeholder bars */}
      <div className="flex items-center gap-0.5 h-5 px-1">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              background: playing ? '#a78bfa' : '#2a2a3a',
              height: `${20 + Math.sin(i * 0.8) * 60}%`,
            }}
            animate={playing ? { height: [`${20 + Math.sin(i * 0.8) * 60}%`, `${40 + Math.sin(i * 0.4 + Date.now() * 0.001) * 50}%`] } : {}}
            transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse', delay: i * 0.03 }}
          />
        ))}
      </div>

      <motion.button
        className="w-full py-1.5 rounded-lg text-xs font-mono font-semibold"
        style={
          isAssigned
            ? { background: '#1e1e2e', color: '#4ade80', border: '1px solid #4ade8044' }
            : isThisSelecting
              ? { background: '#facc1522', color: '#facc15', border: '1px solid #facc1544' }
              : allPadsFull
                ? { background: '#1e1e2e', color: '#3a3a5a', cursor: 'not-allowed' }
                : { background: '#a78bfa', color: '#0a0a0f' }
        }
        whileTap={!isAssigned && !allPadsFull ? { scale: 0.97 } : {}}
        onClick={pickPad}
        disabled={isAssigned || allPadsFull}
      >
        {isAssigned ? 'added to pad' : isThisSelecting ? 'tap a pad to place ↗' : allPadsFull ? 'all pads full' : 'use on pad'}
      </motion.button>
    </div>
  )
}

export function AgentPanel() {
  const messages = useAppStore(s => s.agentMessages)
  const pads = useAppStore(s => s.pads)
  const bpm = useAppStore(s => s.bpm)
  const sessionLoaded = useAppStore(s => s.sessionLoaded)
  const addAgentMessage = useAppStore(s => s.addAgentMessage)
  const setPadSound = useAppStore(s => s.setPadSound)

  const isReturning = sessionLoaded && pads.some(p => p.soundId)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)

  const [greeting] = useState("Tell me what sound you want generated and I'll cook it up")
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleVoiceMessage = useCallback(
    (role: 'user' | 'agent', content: string) => {
      addAgentMessage({ id: crypto.randomUUID(), role, content, timestamp: Date.now() })
    },
    [addAgentMessage]
  )

  const handleSoundGenerated = useCallback(
    (sound: Sound, slotNumber?: number) => {
      // Auto-assign to slot if provided (1-indexed to match pad labels)
      if (slotNumber != null) {
        const pad = pads[slotNumber - 1] ?? pads.find(p => !p.soundId)
        if (pad) setPadSound(pad.id, sound)
      }

      // Auto-play via audio engine
      previewSound(sound.id, sound.url).catch(() => null)

      analytics.agentSoundGenerated(sound.prompt ?? '', sound.name)
      addAgentMessage({
        id: crypto.randomUUID(),
        role: 'agent',
        content: slotNumber != null
          ? `Added "${sound.name}" to pad ${slotNumber}.`
          : `Here's your sound: "${sound.name}"`,
        timestamp: Date.now(),
        sound,
      })
    },
    [addAgentMessage, pads, setPadSound]
  )

  const generatingMsgIdRef = useRef<string | null>(null)

  const handleToolStart = useCallback((prompt: string) => {
    const id = crypto.randomUUID()
    generatingMsgIdRef.current = id
    addAgentMessage({ id, role: 'agent', content: `Cooking up "${prompt}"...`, timestamp: Date.now() })
  }, [addAgentMessage])

  const [muted, setMutedState] = useState(false)
  const voiceStartTimeRef = useRef<number | null>(null)
  const { status: voiceStatus, startSession, endSession, setMuted } = useElevenLabs({
    onMessage: handleVoiceMessage,
    onSoundGenerated: handleSoundGenerated,
    onToolStart: handleToolStart,
  })

  const voiceActive = voiceStatus !== 'idle' && voiceStatus !== 'error'

  // Close onboarding once voice session is live
  useEffect(() => {
    if (voiceStatus === 'listening' || voiceStatus === 'speaking') {
      setShowOnboarding(false)
    }
  }, [voiceStatus])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    addAgentMessage({ id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() })
    analytics.agentMessageSent(text)
    setLoading(true)

    try {
      const { reply } = await sendAgentMessage(text, { pads, bpm })
      addAgentMessage({ id: crypto.randomUUID(), role: 'agent', content: reply, timestamp: Date.now() })
    } catch {
      addAgentMessage({
        id: crypto.randomUUID(),
        role: 'agent',
        content: "I'm having trouble connecting right now. Make sure the API is running.",
        timestamp: Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <VoiceOnboardingModal
            voiceStatus={voiceStatus}
            isReturning={isReturning}
            onEnable={() => startSession({ is_returning: isReturning, greeting })}
            onSkip={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className="flex flex-col border-l shrink-0 overflow-hidden"
        style={{ width: 320, borderColor: '#1e1e2e', background: '#0d0d15' }}
      >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center gap-2 shrink-0" style={{ borderColor: '#1e1e2e' }}>
            <motion.span
              className="text-base"
              style={{ color: '#a78bfa' }}
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              ✦
            </motion.span>
            <span className="text-sm font-bold tracking-wide" style={{ color: '#f3f4f6' }}>
              AI DJ
            </span>

            <AnimatePresence>
              {voiceStatus !== 'idle' && (
                <motion.span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{
                    background: `${STATUS_COLOR[voiceStatus]}22`,
                    color: STATUS_COLOR[voiceStatus],
                    border: `1px solid ${STATUS_COLOR[voiceStatus]}55`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {STATUS_LABEL[voiceStatus]}
                </motion.span>
              )}
            </AnimatePresence>

          </div>

          {/* Speaking visualizer — fixed height so it never causes layout shift */}
          <div
            className="flex items-center justify-center gap-1 shrink-0"
            style={{ height: 28, borderBottom: '1px solid #1e1e2e', background: '#a78bfa08' }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ background: '#a78bfa' }}
                animate={voiceStatus === 'speaking'
                  ? { height: [4, 16, 4], opacity: 1 }
                  : { height: 3, opacity: 0.15 }
                }
                transition={{ duration: 0.6, repeat: voiceStatus === 'speaking' ? Infinity : 0, delay: i * 0.08, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <motion.div
                className="flex-1 flex items-center justify-center text-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm font-mono" style={{ color: '#3a3a5a' }}>
                  {greeting}
                </p>
              </motion.div>
            )}
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="max-w-[85%] px-3 py-2 rounded-2xl text-xs font-mono leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: '#a78bfa22', color: '#e2d9f3', border: '1px solid #a78bfa44', borderBottomRightRadius: 4 }
                      : { background: '#1e1e2e', color: '#c8c8d8', border: '1px solid #2a2a3a', borderBottomLeftRadius: 4 }
                  }
                >
                  {msg.content}
                </div>
                {msg.sound && (
                  <div className="w-[85%]">
                    <SoundCard sound={msg.sound} />
                  </div>
                )}
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl text-xs font-mono" style={{ background: '#1e1e2e', color: '#6b6b80', border: '1px solid #2a2a3a' }}>
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    thinking...
                  </motion.span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input + voice controls */}
          <div className="px-4 py-3 border-t flex flex-col gap-2 shrink-0" style={{ borderColor: '#1e1e2e' }}>

            {/* Text input row */}
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 bg-transparent text-xs font-mono outline-none py-2 px-3 rounded-xl"
                style={{ background: '#1e1e2e', color: '#f3f4f6', border: '1px solid #2a2a3a' }}
                placeholder={voiceActive ? 'Voice active — or type here' : 'Ask the DJ anything...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
              />
              <motion.button
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0"
                style={{
                  background: input.trim() ? '#a78bfa' : '#2a2a3e',
                  color: input.trim() ? '#0a0a0f' : 'rgba(255,255,255,0.75)',
                  transition: 'background 0.15s',
                }}
                whileTap={{ scale: 0.9 }}
                onClick={send}
                disabled={loading}
              >
                ↑
              </motion.button>
            </div>

            {/* Voice controls row */}
            <div className="flex gap-2 items-center">
              {/* Mic / end session button */}
              <motion.button
                className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-mono font-semibold shrink-0"
                style={{
                  background: voiceActive
                    ? voiceStatus === 'listening' ? '#4ade8022' : '#a78bfa22'
                    : '#2a2a3e',
                  color: voiceActive
                    ? voiceStatus === 'listening' ? '#4ade80' : '#a78bfa'
                    : 'rgba(255,255,255,0.75)',
                  border: voiceActive
                    ? `1px solid ${voiceStatus === 'listening' ? '#4ade8044' : '#a78bfa44'}`
                    : '1px solid rgba(255,255,255,0.15)',
                  transition: 'all 0.2s',
                }}
                whileTap={{ scale: 0.96 }}
                animate={voiceStatus === 'listening' ? { boxShadow: ['0 0 0px #4ade8000', '0 0 12px #4ade8066', '0 0 0px #4ade8000'] } : { boxShadow: 'none' }}
                transition={{ duration: 1.4, repeat: voiceStatus === 'listening' ? Infinity : 0 }}
                onClick={() => {
                  if (voiceActive) {
                    endSession()
                    setMutedState(false)
                    if (voiceStartTimeRef.current) {
                      analytics.voiceSessionEnded(Date.now() - voiceStartTimeRef.current)
                      voiceStartTimeRef.current = null
                    }
                  } else {
                    startSession({ is_returning: isReturning, greeting })
                    voiceStartTimeRef.current = Date.now()
                    analytics.voiceSessionStarted()
                  }
                }}
                title={voiceActive ? 'End voice session' : 'Start voice session'}
              >
                {voiceStatus === 'connecting' ? (
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity }}>◌</motion.span>
                ) : voiceActive ? (
                  <><span>⏹</span><span className="text-xs">End</span></>
                ) : (
                  <><span>🎙</span><span className="text-xs">Start Voice</span></>
                )}
              </motion.button>

              {/* Mute button — only shown while voice is active */}
              <AnimatePresence>
                {voiceActive && (
                  <motion.button
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{
                      background: muted ? '#f8717122' : '#2a2a3e',
                      color: muted ? '#f87171' : 'rgba(255,255,255,0.75)',
                      border: muted ? '1px solid #f8717144' : '1px solid rgba(255,255,255,0.15)',
                      transition: 'all 0.15s',
                    }}
                    initial={{ opacity: 0, scale: 0.8, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, scale: 1, width: 40 }}
                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const next = !muted
                      setMutedState(next)
                      setMuted(next)
                      next ? analytics.voiceMuted() : analytics.voiceUnmuted()
                    }}
                    title={muted ? 'Unmute mic' : 'Mute mic'}
                  >
                    {muted ? '🔇' : '🎤'}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

          </div>
      </aside>
    </>
  )
}
