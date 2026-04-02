import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/useAppStore'
import { generateSound } from '../lib/api'
import type { Sound } from '../types'

export function SoundModal() {
  const editingPadId = useAppStore(s => s.editingPadId)
  const pads = useAppStore(s => s.pads)
  const setEditingPad = useAppStore(s => s.setEditingPad)
  const setPadSound = useAppStore(s => s.setPadSound)
  const clearPadSound = useAppStore(s => s.clearPadSound)

  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Sound | null>(null)

  const pad = pads.find(p => p.id === editingPadId)
  const open = !!editingPadId && !!pad

  function close() {
    setEditingPad(null)
    setPrompt('')
    setError(null)
    setPreview(null)
  }

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const sound = await generateSound(prompt.trim())
      setPreview(sound)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  function handleUse() {
    if (!preview || !editingPadId) return
    setPadSound(editingPadId, preview)
    close()
  }

  const PROMPT_SUGGESTIONS = [
    'deep punchy kick drum',
    'crisp snare crack',
    'ethereal pad swell',
    'lo-fi vocal chop',
    'glitchy bass hit',
    'bright synth stab',
    'hype voice shout',
    'rain and thunder ambience',
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background: '#12121a',
              border: `1.5px solid ${pad.color}44`,
              boxShadow: `0 0 40px ${pad.color}22, 0 24px 64px rgba(0,0,0,0.6)`,
            }}
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{
                    background: `${pad.color}22`,
                    border: `1.5px solid ${pad.color}88`,
                    boxShadow: `0 0 12px ${pad.color}44`,
                  }}
                />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#f3f4f6' }}>
                    Pad {pad.label}
                  </p>
                  <p className="text-xs" style={{ color: '#6b6b80' }}>
                    {pad.soundName ?? 'no sound assigned'}
                  </p>
                </div>
              </div>
              <button
                className="text-lg leading-none"
                style={{ color: '#3a3a5a' }}
                onClick={close}
              >
                ✕
              </button>
            </div>

            {/* Prompt input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono" style={{ color: '#6b6b80' }}>
                DESCRIBE YOUR SOUND
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-mono outline-none"
                  style={{
                    background: '#0d0d15',
                    border: `1px solid ${prompt ? pad.color + '66' : '#2a2a3a'}`,
                    color: '#f3f4f6',
                    transition: 'border-color 0.15s',
                  }}
                  placeholder="e.g. punchy kick drum with sub bass..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  autoFocus
                />
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {PROMPT_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="text-[10px] font-mono px-2 py-1 rounded-lg"
                    style={{
                      background: '#1e1e2e',
                      color: '#6b6b80',
                      border: '1px solid #2a2a3a',
                    }}
                    onClick={() => setPrompt(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs font-mono px-3 py-2 rounded-lg" style={{ background: '#f871711a', color: '#f87171', border: '1px solid #f8717133' }}>
                {error}
              </p>
            )}

            {/* Preview result */}
            {preview && (
              <motion.div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: `${pad.color}12`, border: `1px solid ${pad.color}44` }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: pad.color }}>{preview.name}</p>
                  <p className="text-xs" style={{ color: '#6b6b80' }}>{preview.category}</p>
                </div>
                <span className="text-lg" style={{ color: `${pad.color}88` }}>♪</span>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-1">
              {pad.soundId && (
                <button
                  className="px-4 py-2 rounded-xl text-xs font-mono"
                  style={{ background: '#1e1e2e', color: '#f87171', border: '1px solid #f8717133' }}
                  onClick={() => { clearPadSound(pad.id); close() }}
                >
                  Clear
                </button>
              )}
              <motion.button
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-mono flex items-center justify-center gap-2"
                style={{
                  background: loading
                    ? '#1e1e2e'
                    : preview
                      ? `${pad.color}`
                      : `${pad.color}22`,
                  color: preview ? '#0a0a0f' : pad.color,
                  border: `1.5px solid ${pad.color}66`,
                  boxShadow: preview ? `0 0 20px ${pad.color}66` : 'none',
                  opacity: loading ? 0.7 : 1,
                }}
                whileTap={{ scale: 0.97 }}
                disabled={loading || !prompt.trim()}
                onClick={preview ? handleUse : handleGenerate}
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ◌
                    </motion.span>
                    Generating...
                  </>
                ) : preview ? (
                  '✓ Use this sound'
                ) : (
                  '✦ Generate with ElevenLabs'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
