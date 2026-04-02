import type { Sound } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

export async function generateSound(prompt: string): Promise<Sound> {
  const res = await fetch(`${API_URL}/sounds/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? `Generation failed (${res.status})`)
  }
  const sound = await res.json() as Sound
  if (sound.url?.startsWith('/')) sound.url = `${API_URL}${sound.url}`
  return sound
}

export async function loadSession(sessionId: string): Promise<{ pads: unknown[]; bpm: number } | null> {
  const res = await fetch(`${API_URL}/session/${sessionId}`)
  if (!res.ok) return null
  return res.json()
}

export async function saveSession(sessionId: string, payload: { pads: unknown[]; bpm: number }): Promise<void> {
  await fetch(`${API_URL}/session/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getSounds(): Promise<Sound[]> {
  const res = await fetch(`${API_URL}/sounds`)
  if (!res.ok) throw new Error(`Failed to fetch sounds`)
  const data = await res.json()
  return data.sounds
}

export async function searchSounds(query: string): Promise<Sound[]> {
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`Search failed`)
  return res.json()
}

export async function sendAgentMessage(
  message: string,
  context: { pads: unknown; bpm: number }
): Promise<{ reply: string; action?: unknown }> {
  const res = await fetch(`${API_URL}/agent/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? `Agent failed (${res.status})`)
  }
  return res.json()
}
