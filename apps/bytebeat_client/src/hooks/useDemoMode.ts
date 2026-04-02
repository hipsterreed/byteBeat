import { useEffect, useRef } from 'react'
import { useAppStore } from '../stores/useAppStore'
import type { AgentMessage } from '../types'

const DEMO_PADS = [
  { soundId: 'demo_kick',    soundName: 'Punchy Kick',    category: 'drums' },
  { soundId: 'demo_snare',   soundName: 'Crispy Snare',   category: 'drums' },
  { soundId: 'demo_hihat',   soundName: 'Hi-Hat Open',    category: 'drums' },
  { soundId: 'demo_clap',    soundName: 'Room Clap',      category: 'drums' },
  { soundId: 'demo_808',     soundName: '808 Bass',        category: 'bass' },
  { soundId: 'demo_sub',     soundName: 'Sub Rumble',     category: 'bass' },
  { soundId: 'demo_stab',    soundName: 'Synth Stab',     category: 'synth' },
  { soundId: 'demo_lead',    soundName: 'Acid Lead',      category: 'synth' },
  { soundId: 'demo_vocal',   soundName: 'Vocal Chop',     category: 'vocal' },
  { soundId: 'demo_riser',   soundName: 'Tension Riser',  category: 'fx' },
  { soundId: 'demo_crash',   soundName: 'Crash Cymbal',   category: 'drums' },
  { soundId: 'demo_perc',    soundName: 'Clave Perc',     category: 'drums' },
  { soundId: 'demo_pad',     soundName: 'Ambient Pad',    category: 'synth' },
  { soundId: 'demo_chime',   soundName: 'Glass Chime',    category: 'fx' },
  { soundId: 'demo_shaker',  soundName: 'Vinyl Shaker',   category: 'drums' },
  { soundId: 'demo_drop',    soundName: 'Bass Drop',      category: 'bass' },
]

// 16-step pattern: each row is a step, each value is an array of pad indices to flash
// Columns: kick(0), snare(1), hihat(2), clap(3), 808(4), stab(6), perc(11)
const BEAT_PATTERN: number[][] = [
  [0, 4],       // step 1
  [2],          // step 2
  [2, 6],       // step 3
  [2],          // step 4
  [1, 2],       // step 5
  [2, 11],      // step 6
  [2],          // step 7
  [2, 6, 9],    // step 8
  [0, 2],       // step 9
  [2],          // step 10
  [2, 4],       // step 11
  [2, 3],       // step 12
  [1, 2],       // step 13
  [2, 6],       // step 14
  [0, 2, 11],   // step 15
  [2, 7, 10],   // step 16
]

const DEMO_MESSAGES: AgentMessage[] = [
  {
    id: 'demo_1',
    role: 'user',
    content: 'Can you make something that sounds like a late-night trap beat?',
    timestamp: Date.now() - 120000,
  },
  {
    id: 'demo_2',
    role: 'agent',
    content: "On it — I'll layer a punchy 808 kick with some rolling hi-hats and drop a dark synth stab on the 3. Give me a sec.",
    timestamp: Date.now() - 118000,
  },
  {
    id: 'demo_3',
    role: 'agent',
    content: 'Generated "808 Bass" for pad 5. That low-end hits hard around 50 Hz — perfect for that trap feel.',
    timestamp: Date.now() - 115000,
    sound: { id: 'demo_808', name: '808 Bass', url: '', prompt: 'deep 808 bass trap', category: 'bass' },
  },
  {
    id: 'demo_4',
    role: 'user',
    content: 'Nice! Add something atmospheric to fill the space.',
    timestamp: Date.now() - 90000,
  },
  {
    id: 'demo_5',
    role: 'agent',
    content: "I'll add a slow ambient pad with a long release — works great under those hi-hats. Placing it on pad 13.",
    timestamp: Date.now() - 88000,
    sound: { id: 'demo_pad', name: 'Ambient Pad', url: '', prompt: 'dark atmospheric pad', category: 'synth' },
  },
  {
    id: 'demo_6',
    role: 'user',
    content: 'Can you add a vocal chop that comes in every 8 steps?',
    timestamp: Date.now() - 60000,
  },
  {
    id: 'demo_7',
    role: 'agent',
    content: "Chopped and pitched — pad 9 is loaded with a pitched vocal stutter. The tension riser on pad 10 will build nicely into that drop.",
    timestamp: Date.now() - 57000,
    sound: { id: 'demo_vocal', name: 'Vocal Chop', url: '', prompt: 'pitched vocal chop', category: 'vocal' },
  },
]

const BPM = 128
const STEP_MS = (60 / BPM / 4) * 1000 // 16th notes

export function useDemoMode() {
  const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true'
  const initialized = useRef(false)
  const stepRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isDemo || initialized.current) return
    initialized.current = true

    const { sessionLoaded } = useAppStore.getState()

    function init() {
      // Fill all 16 pads with demo sounds (single state update)
      useAppStore.setState(s => ({
        pads: s.pads.map((p, i) => {
          const demo = DEMO_PADS[i]
          if (!demo) return p
          return { ...p, soundId: demo.soundId, soundName: demo.soundName, soundUrl: null }
        }),
      }))

      // Pre-populate chat
      useAppStore.setState({ agentMessages: DEMO_MESSAGES })

      // Start beat sequencer
      intervalRef.current = setInterval(() => {
        const step = stepRef.current % 16
        const padIndices = BEAT_PATTERN[step] ?? []
        padIndices.forEach(i => {
          const pad = useAppStore.getState().pads[i]
          if (pad) useAppStore.getState().flashPad(pad.id)
        })
        stepRef.current++
      }, STEP_MS)
    }

    // Wait for session to be loaded before overwriting pads
    if (sessionLoaded) {
      init()
    } else {
      const unsub = useAppStore.subscribe(state => {
        if (state.sessionLoaded) {
          unsub()
          init()
        }
      })
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isDemo])
}
