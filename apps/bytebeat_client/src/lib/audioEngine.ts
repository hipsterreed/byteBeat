import * as Tone from 'tone'

let started = false
const players = new Map<string, Tone.Player>()
const loading = new Map<string, Promise<void>>()

export async function ensureAudioStarted() {
  if (!started) {
    await Tone.start()
    started = true
  }
}

export async function loadSound(soundId: string, url: string): Promise<void> {
  // Already fully loaded
  if (players.get(soundId)?.loaded) return

  // Already in-flight — wait for the existing promise instead of firing again
  const inflight = loading.get(soundId)
  if (inflight) return inflight

  const promise = new Promise<void>((resolve, reject) => {
    const player = new Tone.Player({
      url,
      onload: () => {
        loading.delete(soundId)
        resolve()
      },
      onerror: () => {
        loading.delete(soundId)
        players.delete(soundId)
        reject(new Error(`Failed to load sound: ${url}`))
      },
    }).toDestination()
    players.set(soundId, player)
  })

  loading.set(soundId, promise)
  return promise
}

export function triggerSound(soundId: string, velocity = 1): void {
  const player = players.get(soundId)
  if (!player?.loaded) return
  player.volume.value = Tone.gainToDb(velocity)
  if (player.state === 'started') player.stop('+0.01')
  player.start()
}

export function isLoaded(soundId: string): boolean {
  return players.get(soundId)?.loaded ?? false
}

export async function previewSound(soundId: string, url: string): Promise<void> {
  await ensureAudioStarted()
  await loadSound(soundId, url)
  triggerSound(soundId)
}
