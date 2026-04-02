import type { Bindings } from "../types";
import { generateSoundEffect, inferCategory, promptToName } from "../lib/elevenlabs";

export const PREBAKED_SOUNDS = [
  { id: "kick_01", name: "Kick Drum", category: "drums", prompt: "deep punchy kick drum", url: "" },
  { id: "snare_01", name: "Snare Crack", category: "drums", prompt: "crisp snare crack", url: "" },
  { id: "hihat_01", name: "Closed Hi-Hat", category: "drums", prompt: "tight closed hi-hat tick", url: "" },
  { id: "bass_01", name: "808 Bass", category: "bass", prompt: "deep 808 sub bass hit", url: "" },
  { id: "lead_01", name: "Synth Lead", category: "synth", prompt: "bright synth lead stab", url: "" },
  { id: "vocal_oh", name: "Vocal Oh", category: "vocal", prompt: "female vocal hit oh", url: "" },
  { id: "fx_riser", name: "Riser", category: "fx", prompt: "electronic riser whoosh buildup", url: "" },
  { id: "fx_drop", name: "Drop Impact", category: "fx", prompt: "bass drop impact explosion", url: "" },
];

/** e.g. "deep punchy kick drum with sub bass" → "deep_punchy_kick_drum_with_a3f1" */
function promptToSlug(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 5);
  // Short hash of the full prompt so two prompts sharing the same first 5 words
  // don't clobber each other's R2 file.
  const hash = btoa(prompt).replace(/[^a-z0-9]/gi, "").slice(0, 4).toLowerCase();
  return [...words, hash].join("_");
}

export async function handleGenerate(env: Bindings, prompt: string, name?: string) {
  if (!env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not set");

  const cacheKey = `sound:${btoa(prompt).slice(0, 32)}`;
  const cached = await env.AUDIO_CACHE.get(cacheKey, "json") as {
    id: string; name: string; url: string; prompt: string; category: string;
  } | null;
  if (cached) return cached;

  const audioBytes = await generateSoundEffect(prompt, env.ELEVENLABS_API_KEY);
  const displayName = name ?? promptToName(prompt);
  const soundId = name
    ? name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)
    : promptToSlug(prompt);
  const r2Key = `sounds/${soundId}.mp3`;

  await env.AUDIO_BUCKET.put(r2Key, audioBytes, {
    httpMetadata: { contentType: "audio/mpeg" },
    customMetadata: { prompt, category: inferCategory(prompt) },
  });

  const result = {
    id: soundId,
    name: displayName,
    url: `/audio/${r2Key}`,
    prompt,
    category: inferCategory(prompt),
  };

  await env.AUDIO_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
  await env.AUDIO_CACHE.put(`id:${soundId}`, JSON.stringify({
    name: result.name, prompt: result.prompt, category: result.category,
  }));
  return result;
}

export async function handleCommunitySounds(env: Bindings) {
  const listed = await env.AUDIO_BUCKET.list({ prefix: "sounds/" });

  // Fetch metadata from KV for each sound (stored during generation)
  const sounds = await Promise.all(
    listed.objects.map(async (obj) => {
      const id = obj.key.replace("sounds/", "").replace(".mp3", "");

      // Try to find cached metadata in KV by soundId
      const meta = await env.AUDIO_CACHE.get(`id:${id}`, "json") as {
        name: string; prompt: string; category: string;
      } | null;

      return {
        id,
        name: meta?.name ?? id,
        url: `/audio/${obj.key}`,
        prompt: meta?.prompt ?? "",
        category: meta?.category ?? "misc",
      };
    })
  );

  return { sounds: sounds.reverse() };
}

export async function handleAudioServe(env: Bindings, key: string): Promise<Response> {
  const obj = await env.AUDIO_BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "audio/mpeg",
      "Cache-Control": "public, max-age=31536000",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
