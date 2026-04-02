export interface Pad {
  id: string
  label: string
  color: string
  soundId: string | null
  soundName: string | null
  soundUrl: string | null
  midiNote: number
}

export interface Sound {
  id: string
  name: string
  url: string
  prompt: string
  category: string
}

export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number
  sound?: Sound
}
