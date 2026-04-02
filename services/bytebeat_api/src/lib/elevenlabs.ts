export interface GeneratedSound {
  id: string;
  name: string;
  url: string;
  prompt: string;
  category: string;
}

/**
 * Generate a sound effect from a text prompt using ElevenLabs Sound Generation API.
 * Returns the raw audio bytes.
 */
export async function generateSoundEffect(
  prompt: string,
  apiKey: string,
  durationSeconds = 2
): Promise<ArrayBuffer> {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: durationSeconds,
      prompt_influence: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${err}`);
  }

  return res.arrayBuffer();
}

/**
 * Generate speech from text using ElevenLabs TTS.
 */
export async function generateSpeech(
  text: string,
  apiKey: string,
  voiceId: string
): Promise<ArrayBuffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs TTS error ${res.status}: ${err}`);
  }

  return res.arrayBuffer();
}

/** Infer a category from the prompt text */
export function inferCategory(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.match(/kick|bass drum|808/)) return "drums";
  if (p.match(/snare|clap|crack/)) return "drums";
  if (p.match(/hi.?hat|cymbal|tick/)) return "drums";
  if (p.match(/bass|sub/)) return "bass";
  if (p.match(/synth|lead|stab|pad/)) return "synth";
  if (p.match(/vocal|voice|say|shout|sing/)) return "vocal";
  if (p.match(/riser|sweep|whoosh|drop|impact|fx|effect/)) return "fx";
  if (p.match(/chord|piano|keys|organ/)) return "keys";
  return "misc";
}

/** Turn a prompt into a clean sound name */
export function promptToName(prompt: string): string {
  return prompt
    .split(" ")
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
