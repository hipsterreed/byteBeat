export interface Bindings {
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_VOICE_ID: string;
  AUDIO_BUCKET: R2Bucket;
  AUDIO_CACHE: KVNamespace;
  AI: Ai;
  SESSION_DO: DurableObjectNamespace;
  TIMELINE_DO: DurableObjectNamespace;
}
