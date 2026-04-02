import mixpanel from 'mixpanel-browser'

const token = import.meta.env.VITE_MIXPANEL_TOKEN
const enabled = !!token

if (enabled) {
  mixpanel.init(token, { persistence: 'localStorage', autocapture: false })
}

function track(event: string, props?: Record<string, unknown>) {
  if (!enabled) return
  mixpanel.track(event, props)
}

// Session
export const analytics = {
  sessionStarted(sessionId: string) {
    track('Session Started', { session_id: sessionId })
  },

  // Pads
  padTriggered(padLabel: string, soundName: string) {
    track('Pad Triggered', { pad: padLabel, sound: soundName })
  },

  // Sound modal
  soundModalOpened(padLabel: string) {
    track('Sound Modal Opened', { pad: padLabel })
  },

  // Sound generation
  soundGenerateClicked(prompt: string) {
    track('Sound Generate Clicked', { prompt })
  },
  soundGenerated(prompt: string, soundName: string, category: string) {
    track('Sound Generated', { prompt, sound_name: soundName, category })
  },
  soundGenerateFailed(prompt: string, error: string) {
    track('Sound Generate Failed', { prompt, error })
  },

  // Sound assignment
  soundAssigned(padLabel: string, soundName: string, category: string, source: 'generated' | 'library') {
    track('Sound Assigned', { pad: padLabel, sound_name: soundName, category, source })
  },
  soundCleared(padLabel: string) {
    track('Sound Cleared', { pad: padLabel })
  },

  // Voice / AI DJ
  voiceSessionStarted() {
    track('Voice Session Started')
  },
  voiceSessionEnded(durationMs: number) {
    track('Voice Session Ended', { duration_ms: durationMs })
  },
  voiceMuted() {
    track('Voice Muted')
  },
  voiceUnmuted() {
    track('Voice Unmuted')
  },

  // Agent text chat
  agentMessageSent(message: string) {
    track('Agent Message Sent', { message })
  },
  agentSoundGenerated(prompt: string, soundName: string) {
    track('Agent Sound Generated', { prompt, sound_name: soundName })
  },

  // Community library
  communitySoundPreviewed(soundName: string, category: string) {
    track('Community Sound Previewed', { sound_name: soundName, category })
  },
}
