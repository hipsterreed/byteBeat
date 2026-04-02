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

export async function handleGenerate(env: Bindings, prompt: string) {
  if (!env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not set");

  const cacheKey = `sound:${btoa(prompt).slice(0, 32)}`;
  const cached = await env.AUDIO_CACHE.get(cacheKey, "json") as {
    id: string; name: string; url: string; prompt: string; category: string;
  } | null;
  if (cached) return cached;

  const audioBytes = await generateSoundEffect(prompt, env.ELEVENLABS_API_KEY);
  const soundId = `gen_${crypto.randomUUID().slice(0, 8)}`;
  const r2Key = `sounds/${soundId}.mp3`;

  await env.AUDIO_BUCKET.put(r2Key, audioBytes, {
    httpMetadata: { contentType: "audio/mpeg" },
    customMetadata: { prompt, category: inferCategory(prompt) },
  });

  const result = {
    id: soundId,
    name: promptToName(prompt),
    url: `/audio/${r2Key}`,
    prompt,
    category: inferCategory(prompt),
  };

  await env.AUDIO_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
  return result;
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
