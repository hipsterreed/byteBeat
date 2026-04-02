import { create } from 'zustand'
import type { Pad, Sound, AgentMessage } from '../types'
import {
  triggerSound as triggerAudio,
  ensureAudioStarted,
  loadSound,
  isLoaded,
} from '../lib/audioEngine'
import { loadSession, saveSession } from '../lib/api'
import { analytics } from '../lib/analytics'

// Neon pastel undertones — white by default, color lives inside like light through frosted glass
const PAD_COLORS = [
  '#7ef4fb', // icy cyan
  '#86efac', // soft mint
  '#c4b5fd', // electric lavender
  '#ffb3c6', // peach pink
  '#93c5fd', // pastel blue
  '#d8b4fe', // acid lilac
  '#fda4af', // pale coral
  '#bbf7d0', // soft lime
  '#fde68a', // warm lemon
  '#fed7aa', // soft peach
  '#f9a8d4', // rose
  '#bae6fd', // sky blue
  '#99f6e4', // teal
  '#ddd6fe', // violet
  '#fecdd3', // blush
  '#d9f99d', // lime
]

function makePads(): Pad[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `pad_${i}`,
    label: `${i + 1}`,
    color: PAD_COLORS[i] ?? '#c4b5fd',
    soundId: null,
    soundName: null,
    soundUrl: null,
    midiNote: 36 + i,
  }))
}

function getOrCreateSessionId(): string {
  const params = new URLSearchParams(window.location.search)
  const urlSession = params.get('session')

  if (urlSession) {
    localStorage.setItem('bytebeat_session_id', urlSession)
    return urlSession
  }

  // Get or create, then always sync back to URL
  let id = localStorage.getItem('bytebeat_session_id')
  if (!id || id === 'null') {
    id = crypto.randomUUID()
    localStorage.setItem('bytebeat_session_id', id)
  }

  params.set('session', id)
  window.history.replaceState({}, '', `?${params.toString()}`)
  return id
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSave(sessionId: string, pads: Pad[], bpm: number) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveSession(sessionId, { pads, bpm })
  }, 800)
}

interface AppState {
  pads: Pad[]
  bpm: number
  isPlaying: boolean
  activePadIds: string[]
  editingPadId: string | null
  agentOpen: boolean
  agentMessages: AgentMessage[]
  sessionId: string
  sessionLoaded: boolean
  selectingSound: Sound | null

  initSession: () => Promise<void>
  triggerPad: (padId: string) => Promise<void>
  setPadSound: (padId: string, sound: Sound) => void
  clearPadSound: (padId: string) => void
  setBpm: (bpm: number) => void
  togglePlay: () => void
  setEditingPad: (padId: string | null) => void
  toggleAgent: () => void
  addAgentMessage: (msg: AgentMessage) => void
  setSelectingSound: (sound: Sound | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  pads: makePads(),
  bpm: 120,
  isPlaying: false,
  activePadIds: [],
  editingPadId: null,
  agentOpen: true,
  sessionId: '',
  sessionLoaded: false,
  selectingSound: null,
  agentMessages: [],

  initSession: async () => {
    const sessionId = getOrCreateSessionId()
    set({ sessionId })

    try {
      const data = await loadSession(sessionId) as {
        pads?: Pad[]
        bpm?: number
      } | null

      if (data?.pads) {
        // Restore pads, keeping colors from defaults (colors aren't stored in DO)
        const defaults = makePads()
        const restored = data.pads.map((saved: Pad, i: number) => ({
          ...defaults[i],
          ...saved,
          color: defaults[i]?.color ?? '#c4b5fd',
        }))
        set({ pads: restored, bpm: data.bpm ?? 120 })
      }
    } catch {
      // Session load failed — start fresh, no problem
    }

    set({ sessionLoaded: true })
    analytics.sessionStarted(sessionId)
  },

  triggerPad: async (padId) => {
    await ensureAudioStarted()
    const pad = get().pads.find(p => p.id === padId)
    if (!pad?.soundId) return

    if (!isLoaded(pad.soundId) && pad.soundUrl) {
      await loadSound(pad.soundId, pad.soundUrl)
    }

    set(s => ({ activePadIds: [...s.activePadIds, padId] }))
    triggerAudio(pad.soundId)
    analytics.padTriggered(pad.label, pad.soundName ?? pad.soundId)
    setTimeout(() => {
      set(s => ({ activePadIds: s.activePadIds.filter(id => id !== padId) }))
    }, 250)
  },

  setPadSound: (padId, sound) => {
    const pad = get().pads.find(p => p.id === padId)
    set(s => ({
      pads: s.pads.map(p =>
        p.id === padId
          ? { ...p, soundId: sound.id, soundName: sound.name, soundUrl: sound.url }
          : p
      ),
      editingPadId: null,
    }))
    if (sound.url) loadSound(sound.id, sound.url)
    analytics.soundAssigned(pad?.label ?? padId, sound.name, sound.category ?? 'misc', 'library')
    const { pads, bpm, sessionId } = get()
    debouncedSave(sessionId, pads, bpm)
  },

  clearPadSound: (padId) => {
    const pad = get().pads.find(p => p.id === padId)
    set(s => ({
      pads: s.pads.map(p =>
        p.id === padId
          ? { ...p, soundId: null, soundName: null, soundUrl: null }
          : p
      ),
    }))
    analytics.soundCleared(pad?.label ?? padId)
    const { pads, bpm, sessionId } = get()
    debouncedSave(sessionId, pads, bpm)
  },

  setBpm: (bpm) => {
    set({ bpm })
    const { pads, sessionId } = get()
    debouncedSave(sessionId, pads, bpm)
  },

  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),
  setEditingPad: (padId) => set({ editingPadId: padId }),
  toggleAgent: () => set(s => ({ agentOpen: !s.agentOpen })),
  addAgentMessage: (msg) =>
    set(s => ({ agentMessages: [...s.agentMessages, msg] })),
  setSelectingSound: (sound) => set({ selectingSound: sound }),
}))
