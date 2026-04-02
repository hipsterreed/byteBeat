import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../stores/useAppStore'
import { sendAgentMessage } from '../lib/api'
import type { AgentMessage } from '../types'

export function AgentPanel() {
  const messages = useAppStore(s => s.agentMessages)
  const agentOpen = useAppStore(s => s.agentOpen)
  const pads = useAppStore(s => s.pads)
  const bpm = useAppStore(s => s.bpm)
  const addAgentMessage = useAppStore(s => s.addAgentMessage)

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    addAgentMessage(userMsg)
    setLoading(true)

    try {
      const { reply } = await sendAgentMessage(text, { pads, bpm })
      addAgentMessage({
        id: crypto.randomUUID(),
        role: 'agent',
        content: reply,
        timestamp: Date.now(),
      })
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

  const QUICK_PROMPTS = [
    'Suggest a beat pattern',
    'What BPM should I use?',
    'Generate me a kick sound',
    'Make it more lo-fi',
  ]

  return (
    <AnimatePresence>
      {agentOpen && (
        <motion.aside
          className="flex flex-col border-l shrink-0 overflow-hidden"
          style={{
            width: 320,
            borderColor: '#1e1e2e',
            background: '#0d0d15',
          }}
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b flex items-center gap-2 shrink-0"
            style={{ borderColor: '#1e1e2e' }}
          >
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
            <span className="text-xs ml-auto" style={{ color: '#3a3a5a' }}>
              powered by Workers AI
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="max-w-[85%] px-3 py-2 rounded-2xl text-xs font-mono leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? {
                          background: '#a78bfa22',
                          color: '#e2d9f3',
                          border: '1px solid #a78bfa44',
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: '#1e1e2e',
                          color: '#c8c8d8',
                          border: '1px solid #2a2a3a',
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded-2xl text-xs font-mono"
                  style={{ background: '#1e1e2e', color: '#6b6b80', border: '1px solid #2a2a3a' }}
                >
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    thinking...
                  </motion.span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t" style={{ borderColor: '#1e1e2e' }}>
            {QUICK_PROMPTS.map(q => (
              <button
                key={q}
                className="text-[10px] font-mono px-2 py-1 rounded-lg"
                style={{ background: '#1e1e2e', color: '#6b6b80', border: '1px solid #2a2a3a' }}
                onClick={() => { setInput(q); }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            className="px-4 py-3 border-t flex gap-2 items-center shrink-0"
            style={{ borderColor: '#1e1e2e' }}
          >
            <input
              className="flex-1 bg-transparent text-xs font-mono outline-none py-2 px-3 rounded-xl"
              style={{
                background: '#1e1e2e',
                color: '#f3f4f6',
                border: '1px solid #2a2a3a',
              }}
              placeholder="Ask the DJ anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <motion.button
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs"
              style={{
                background: input.trim() ? '#a78bfa' : '#1e1e2e',
                color: input.trim() ? '#0a0a0f' : '#3a3a5a',
                transition: 'background 0.15s',
              }}
              whileTap={{ scale: 0.9 }}
              onClick={send}
              disabled={loading}
            >
              ↑
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
