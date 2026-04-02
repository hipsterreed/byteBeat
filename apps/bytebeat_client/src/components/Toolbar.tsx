import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../stores/useAppStore'

export function Toolbar() {
  const bpm = useAppStore(s => s.bpm)
  const isPlaying = useAppStore(s => s.isPlaying)
  const agentOpen = useAppStore(s => s.agentOpen)
  const setBpm = useAppStore(s => s.setBpm)
  const togglePlay = useAppStore(s => s.togglePlay)
  const toggleAgent = useAppStore(s => s.toggleAgent)
  const [editingBpm, setEditingBpm] = useState(false)
  const [bpmInput, setBpmInput] = useState(String(bpm))

  function commitBpm() {
    const val = parseInt(bpmInput)
    if (!isNaN(val) && val >= 20 && val <= 300) setBpm(val)
    else setBpmInput(String(bpm))
    setEditingBpm(false)
  }

  return (
    <header
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{
        background: '#0c0c12',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: '#a78bfa',
            boxShadow: '0 0 8px #a78bfa, 0 0 20px #a78bfa66',
          }}
        />
        <span
          className="text-sm font-bold tracking-[0.22em] uppercase"
          style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.22em' }}
        >
          ByteBeat
        </span>
      </div>

      {/* Center transport controls */}
      <div className="flex items-center gap-5">
        {/* BPM control */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            className="w-4 h-4 flex items-center justify-center text-xs rounded"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onClick={() => setBpm(Math.max(20, bpm - 1))}
          >
            −
          </button>

          {editingBpm ? (
            <input
              autoFocus
              className="w-10 text-center text-sm bg-transparent outline-none border-b"
              style={{ color: 'rgba(255,255,255,0.85)', borderColor: '#a78bfa' }}
              value={bpmInput}
              onChange={e => setBpmInput(e.target.value)}
              onBlur={commitBpm}
              onKeyDown={e => e.key === 'Enter' && commitBpm()}
            />
          ) : (
            <button
              className="w-10 text-center text-sm font-mono"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              onClick={() => { setBpmInput(String(bpm)); setEditingBpm(true) }}
            >
              {bpm}
            </button>
          )}

          <button
            className="w-4 h-4 flex items-center justify-center text-xs rounded"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onClick={() => setBpm(Math.min(300, bpm + 1))}
          >
            +
          </button>

          <span
            className="text-[9px] font-mono tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            BPM
          </span>
        </div>

        {/* Play / Stop */}
        <motion.button
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{
            background: isPlaying
              ? 'rgba(248,113,113,0.15)'
              : 'rgba(134,239,172,0.12)',
            color: isPlaying ? '#fda4af' : '#86efac',
            border: `1px solid ${isPlaying ? 'rgba(248,113,113,0.3)' : 'rgba(134,239,172,0.25)'}`,
            boxShadow: isPlaying
              ? '0 0 14px rgba(253,164,175,0.35)'
              : '0 0 14px rgba(134,239,172,0.3)',
          }}
          whileTap={{ scale: 0.88 }}
          onClick={togglePlay}
        >
          {isPlaying ? '■' : '▶'}
        </motion.button>
      </div>

      {/* AI DJ toggle */}
      <motion.button
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono"
        style={{
          background: agentOpen ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
          color: agentOpen ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
          border: `1px solid ${agentOpen ? 'rgba(196,181,253,0.3)' : 'rgba(255,255,255,0.07)'}`,
          boxShadow: agentOpen ? '0 0 12px rgba(167,139,250,0.3)' : 'none',
          transition: 'all 0.15s ease',
        }}
        whileTap={{ scale: 0.94 }}
        onClick={toggleAgent}
      >
        <motion.span
          animate={agentOpen ? { rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ✦
        </motion.span>
        <span>AI DJ</span>
      </motion.button>
    </header>
  )
}
