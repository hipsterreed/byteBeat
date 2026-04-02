import { useRef, useState, useCallback } from 'react'
import { Conversation } from '@elevenlabs/client'
import { generateSound } from '../lib/api'
import type { Sound } from '../types'

export type VoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error'

interface UseElevenLabsOptions {
  onMessage?: (role: 'user' | 'agent', content: string) => void
  onSoundGenerated?: (sound: Sound, slotNumber?: number) => void
}

export function useElevenLabs({ onMessage, onSoundGenerated }: UseElevenLabsOptions = {}) {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const conversationRef = useRef<Conversation | null>(null)

  const startSession = useCallback(async (dynamicVariables?: Record<string, string | number | boolean>) => {
    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID
    if (!agentId || agentId === 'your_agent_id_here') {
      setStatus('error')
      return
    }
    setStatus('connecting')
    try {
      conversationRef.current = await Conversation.startSession({
        agentId,
        connectionType: 'websocket',
        ...(dynamicVariables ? { dynamicVariables } : {}),
        clientTools: {
          generate_sound: async ({ prompt, name, slot_number }: { prompt: string; name?: string; slot_number?: number }) => {
            try {
              const sound = await generateSound(prompt, name)
              onSoundGenerated?.(sound, slot_number)
              return `Generated "${sound.name}" successfully.`
            } catch {
              return 'Sound generation failed. Please try again.'
            }
          },
        },
        onConnect: () => setStatus('listening'),
        onDisconnect: () => setStatus('idle'),
        onModeChange: ({ mode }) => {
          if (mode === 'speaking') setStatus('speaking')
          else if (mode === 'listening') setStatus('listening')
        },
        onMessage: ({ role, message }) => {
          onMessage?.(role as 'user' | 'agent', message)
        },
        onError: () => setStatus('error'),
      })
    } catch {
      setStatus('error')
    }
  }, [onMessage, onSoundGenerated])

  const endSession = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession()
      conversationRef.current = null
    }
    setStatus('idle')
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    conversationRef.current?.setMicMuted(muted)
  }, [])

  return { status, startSession, endSession, setMuted }
}
