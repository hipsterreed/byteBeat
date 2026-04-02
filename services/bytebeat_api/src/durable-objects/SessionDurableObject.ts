import { DurableObject } from "cloudflare:workers";

export interface SessionState {
  sessionId: string;
  pads: PadConfig[];
  bpm: number;
  createdAt: number;
  updatedAt: number;
}

export interface PadConfig {
  id: string;
  soundId: string | null;
  soundName: string | null;
  soundUrl: string | null;
  label: string;
  color: string;
  velocity: number;
  midiNote: number;
}

export class SessionDurableObject extends DurableObject {
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json" };

    if (request.method === "GET" && url.pathname === "/session") {
      const stored = await this.ctx.storage.get<SessionState>("session");
      return new Response(JSON.stringify(stored ?? null), { headers });
    }

    if (request.method === "PUT" && url.pathname === "/session") {
      const body = (await request.json()) as Partial<SessionState>;
      const existing = await this.ctx.storage.get<SessionState>("session");
      const updated: SessionState = {
        sessionId: existing?.sessionId ?? crypto.randomUUID(),
        pads: body.pads ?? existing?.pads ?? defaultPads(),
        bpm: body.bpm ?? existing?.bpm ?? 120,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await this.ctx.storage.put("session", updated);
      return new Response(JSON.stringify(updated), { headers });
    }

    return new Response("Not found", { status: 404 });
  }
}

const PAD_COLORS = [
  "#7ef4fb", "#86efac", "#c4b5fd", "#ffb3c6",
  "#93c5fd", "#d8b4fe", "#fda4af", "#bbf7d0",
  "#fde68a", "#fed7aa", "#f9a8d4", "#bae6fd",
  "#99f6e4", "#ddd6fe", "#fecdd3", "#d9f99d",
];

function defaultPads(): PadConfig[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `pad_${i}`,
    soundId: null,
    soundName: null,
    soundUrl: null,
    label: `${i + 1}`,
    color: PAD_COLORS[i] ?? "#c4b5fd",
    velocity: 100,
    midiNote: 36 + i,
  }));
}
