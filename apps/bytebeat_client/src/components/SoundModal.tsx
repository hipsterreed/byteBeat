import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/useAppStore'
import { generateSound, getCommunitySounds } from '../lib/api'
import { previewSound } from '../lib/audioEngine'
import type { Sound } from '../types'

const SUGGESTIONS = [
  'deep punchy kick', 'crisp snare crack', 'open hi-hat',
  'sub bass hit', 'synth stab', 'vocal chop',
  'riser sweep', 'glitch fx', 'choir swell', 'bass drop',
]

const CAT_COLOR: Record<string, string> = {
  drums: '#f87171', bass: '#fb923c', synth: '#a78bfa',
  vocal: '#f472b6', fx: '#67e8f9', keys: '#86efac', misc: '#94a3b8',
}

function CategoryBadge({ category }: { category: string }) {
  const color = CAT_COLOR[category] ?? CAT_COLOR.misc
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 font-semibold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {category}
    </span>
  )
}

/** ElevenLabs brand mark — the "11" pill bars + wordmark */
function ElevenLabsLogo() {
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
      <svg viewBox="0 0 13 18" width="8" height="11" fill="currentColor" aria-hidden>
        <rect x="0"   y="0" width="5" height="18" rx="2.5"/>
        <rect x="8"   y="0" width="5" height="18" rx="2.5"/>
      </svg>
      <span className="text-[10px] font-semibold tracking-wide" style={{ fontFamily: 'system-ui, sans-serif' }}>
        ElevenLabs
      </span>
    </span>
  )
}

export function SoundModal() {
  const editingPadId = useAppStore(s => s.editingPadId)
  const pads = useAppStore(s => s.pads)
  const setEditingPad = useAppStore(s => s.setEditingPad)
  const setPadSound = useAppStore(s => s.setPadSound)
  const clearPadSound = useAppStore(s => s.clearPadSound)

  const [tab, setTab] = useState<'generate' | 'community'>('generate')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Sound | null>(null)
  const [community, setCommunity] = useState<Sound[]>([])
  const [communityLoading, setCommunityLoading] = useState(false)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pad = pads.find(p => p.id === editingPadId)
  const open = !!editingPadId && !!pad
  const c = pad?.color ?? '#a78bfa'

  useEffect(() => {
    if (open) {
      setTab('generate')
      setPrompt('')
      setError(null)
      setGenerated(null)
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open, editingPadId])

  useEffect(() => {
    if (open && tab === 'community' && community.length === 0) {
      setCommunityLoading(true)
      getCommunitySounds().then(setCommunity).finally(() => setCommunityLoading(false))
    }
  }, [open, tab])

  function close() { setEditingPad(null) }

  async function handleGenerate() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setGenerated(null)
    try {
      const sound = await generateSound(prompt.trim())
      setGenerated(sound)
      setCommunity(s => [sound, ...s.filter(x => x.id !== sound.id)])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  function handleUse(sound: Sound) {
    if (!editingPadId) return
    setPadSound(editingPadId, sound)
    close()
  }

  async function handlePreview(sound: Sound) {
    if (previewingId === sound.id) return
    setPreviewingId(sound.id)
    try { await previewSound(sound.id, sound.url) }
    finally { setTimeout(() => setPreviewingId(p => p === sound.id ? null : p), 800) }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
      >
        <motion.div
          className="w-full sm:w-[620px] flex flex-col overflow-hidden sm:rounded-2xl rounded-t-2xl"
          style={{
            maxHeight: '82vh',
            background: 'linear-gradient(160deg, #1a1a26 0%, #111118 100%)',
            boxShadow: `0 0 0 1px rgba(255,255,255,0.09), 0 0 80px ${c}20, 0 40px 100px rgba(0,0,0,0.85)`,
          }}
          initial={{ y: 40, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          onClick={e => e.stopPropagation()}
        >

          {/* ── Header ── */}
          <div className="flex items-center gap-4 px-6 pt-6 pb-5 shrink-0">
            <div
              className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold"
              style={{
                background: `color-mix(in srgb, ${c} 18%, white)`,
                boxShadow: `0 0 20px ${c}44, inset 0 1px 1px rgba(255,255,255,0.6)`,
                color: `color-mix(in srgb, ${c} 80%, #111)`,
              }}
            >
              {pad.label}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Assign Sound
              </p>
              <p className="text-[12px] font-mono truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {pad.soundName
                  ? <>Currently: <span style={{ color: c }}>{pad.soundName}</span></>
                  : 'No sound assigned'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {pad.soundId && (
                <button
                  className="text-[12px] font-mono px-3 py-1.5 rounded-lg"
                  style={{ color: '#f87171', background: '#f8717118', border: '1px solid #f8717133' }}
                  onClick={() => { clearPadSound(pad.id); close() }}
                >
                  Clear
                </button>
              )}
              <button
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.07)' }}
                onClick={close}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-0 px-6 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {(['generate', 'community'] as const).map(t => (
              <button
                key={t}
                className="relative pb-3 pr-5 text-[13px] font-mono font-semibold capitalize"
                style={{ color: tab === t ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)', transition: 'color 0.15s' }}
                onClick={() => setTab(t)}
              >
                {t === 'generate' ? '✦ Generate' : `◎ Library${community.length > 0 ? ` (${community.length})` : ''}`}
                {tab === t && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-5 h-[2px] rounded-full"
                    style={{ background: c }}
                    layoutId="modal-tab"
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Tab: Generate ── */}
          <AnimatePresence mode="wait">
            {tab === 'generate' && (
              <motion.div
                key="generate"
                className="flex flex-col gap-5 p-6 flex-1 overflow-y-auto"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                {/* Input */}
                <div className="flex flex-col gap-3">
                  <div
                    className="flex items-center gap-2 rounded-xl px-4 py-3"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${prompt ? c + '55' : 'rgba(255,255,255,0.12)'}`,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>✦</span>
                    <input
                      ref={inputRef}
                      className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-white/40"
                      style={{ color: 'rgba(255,255,255,0.92)', caretColor: c }}
                      placeholder="Describe your sound..."
                      value={prompt}
                      onChange={e => { setPrompt(e.target.value); setGenerated(null); setError(null) }}
                      onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    />
                    {prompt && (
                      <button
                        onClick={() => { setPrompt(''); setGenerated(null) }}
                        style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        aria-label="Clear input"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Suggestion chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-lg"
                        style={{
                          background: prompt === s ? `${c}22` : 'rgba(255,255,255,0.06)',
                          color: prompt === s ? c : 'rgba(255,255,255,0.6)',
                          border: `1px solid ${prompt === s ? c + '55' : 'rgba(255,255,255,0.1)'}`,
                          transition: 'all 0.12s',
                        }}
                        onClick={() => { setPrompt(s); setGenerated(null); setError(null) }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="flex items-start gap-2 px-4 py-3 rounded-xl text-[13px] font-mono"
                    style={{ background: '#f8717118', color: '#f87171', border: '1px solid #f8717133' }}
                  >
                    <span>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Generated preview card */}
                <AnimatePresence>
                  {generated && (
                    <motion.div
                      className="flex items-center gap-4 px-4 py-4 rounded-xl"
                      style={{ background: `${c}12`, border: `1px solid ${c}33` }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.button
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{
                          background: previewingId === generated.id ? c : `${c}28`,
                          color: previewingId === generated.id ? '#0a0a0f' : c,
                          boxShadow: previewingId === generated.id ? `0 0 16px ${c}88` : 'none',
                        }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePreview(generated)}
                        aria-label="Preview sound"
                      >
                        {previewingId === generated.id
                          ? <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>◼</motion.span>
                          : '▶'}
                      </motion.button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: c }}>{generated.name}</p>
                        <p className="text-[12px] font-mono truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {generated.prompt}
                        </p>
                      </div>
                      <CategoryBadge category={generated.category} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <div className="flex flex-col items-center gap-2 mt-auto">
                  <motion.button
                    className="w-full py-3 rounded-xl text-sm font-bold font-mono flex items-center justify-center gap-2"
                    style={{
                      background: generated ? c : `${c}20`,
                      color: generated ? '#0a0a0f' : c,
                      border: `1px solid ${generated ? c : c + '44'}`,
                      boxShadow: generated ? `0 0 24px ${c}55` : 'none',
                      opacity: (!prompt.trim() && !generated) || loading ? 0.45 : 1,
                      transition: 'all 0.2s',
                    }}
                    whileTap={{ scale: 0.97 }}
                    disabled={(!prompt.trim() && !generated) || loading}
                    onClick={generated ? () => handleUse(generated) : handleGenerate}
                  >
                    {loading ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>◌</motion.span>
                        Generating...
                      </>
                    ) : generated ? (
                      <><span>✓</span> Assign to Pad {pad.label}</>
                    ) : (
                      <><span>✦</span> Generate Sound</>
                    )}
                  </motion.button>

                  {!generated && (
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      powered by <ElevenLabsLogo />
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Tab: Library ── */}
            {tab === 'community' && (
              <motion.div
                key="community"
                className="flex flex-col flex-1 overflow-hidden"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
              >
                {communityLoading ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <motion.span
                      className="text-sm font-mono"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      Loading library...
                    </motion.span>
                  </div>
                ) : community.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                    <div className="text-3xl" style={{ opacity: 0.3 }}>♪</div>
                    <p className="text-sm font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      Library is empty
                    </p>
                    <p className="text-[12px] font-mono text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Generate some sounds and they'll appear here
                    </p>
                    <button
                      className="mt-2 text-[12px] font-mono font-semibold px-4 py-2 rounded-xl"
                      style={{ color: c, border: `1px solid ${c}44`, background: `${c}12` }}
                      onClick={() => setTab('generate')}
                    >
                      ✦ Generate a sound
                    </button>
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 p-3">
                    <div className="flex flex-col gap-1">
                      {community.map((sound, i) => {
                        const isAssigned = pad.soundId === sound.id
                        const isPreviewing = previewingId === sound.id
                        const catColor = CAT_COLOR[sound.category] ?? '#94a3b8'

                        return (
                          <motion.div
                            key={sound.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                            style={{
                              background: isAssigned ? `${c}14` : 'transparent',
                              border: `1px solid ${isAssigned ? c + '35' : 'transparent'}`,
                              transition: 'all 0.12s',
                            }}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                          >
                            {/* Preview button */}
                            <motion.button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 font-bold"
                              style={{
                                background: isPreviewing ? `${catColor}28` : 'rgba(255,255,255,0.08)',
                                color: isPreviewing ? catColor : 'rgba(255,255,255,0.6)',
                                border: `1px solid ${isPreviewing ? catColor + '55' : 'rgba(255,255,255,0.1)'}`,
                              }}
                              whileTap={{ scale: 0.88 }}
                              onClick={() => handlePreview(sound)}
                              aria-label={`Preview ${sound.name}`}
                            >
                              {isPreviewing
                                ? <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>◼</motion.span>
                                : '▶'}
                            </motion.button>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="text-[13px] font-bold truncate"
                                  style={{ color: isAssigned ? c : 'rgba(255,255,255,0.88)' }}
                                >
                                  {sound.name}
                                </span>
                                <CategoryBadge category={sound.category} />
                              </div>
                              {sound.prompt && (
                                <p
                                  className="text-[11px] font-mono truncate mt-0.5"
                                  style={{ color: 'rgba(255,255,255,0.45)' }}
                                >
                                  {sound.prompt}
                                </p>
                              )}
                            </div>

                            {/* Use button */}
                            <motion.button
                              className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-mono font-bold"
                              style={{
                                background: isAssigned ? c : `${c}18`,
                                color: isAssigned ? '#0a0a0f' : c,
                                border: `1px solid ${isAssigned ? c : c + '44'}`,
                                boxShadow: isAssigned ? `0 0 12px ${c}44` : 'none',
                              }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleUse(sound)}
                            >
                              {isAssigned ? '✓ In use' : 'Use'}
                            </motion.button>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
