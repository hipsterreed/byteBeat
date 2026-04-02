import { DurableObject } from "cloudflare:workers";

export interface TimelineState {
  timelineId: string;
  bpm: number;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
}

export interface Track {
  id: string;
  name: string;
  color: string;
  events: TrackEvent[];
  muted: boolean;
  volume: number;
}

export interface TrackEvent {
  id: string;
  soundId: string;
  startBeat: number;
  durationBeats: number;
  velocity: number;
}

export class TimelineDurableObject extends DurableObject {
  private sessions = new Set<WebSocket>();

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      const { 0: client, 1: server } = new WebSocketPair();
      this.ctx.acceptWebSocket(server);
      this.sessions.add(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (request.method === "GET" && url.pathname === "/timeline") {
      const stored = await this.ctx.storage.get<TimelineState>("timeline");
      return Response.json(stored ?? null);
    }

    if (request.method === "PUT" && url.pathname === "/timeline") {
      const body = (await request.json()) as Partial<TimelineState>;
      const existing = await this.ctx.storage.get<TimelineState>("timeline");
      const updated: TimelineState = {
        timelineId: existing?.timelineId ?? crypto.randomUUID(),
        bpm: body.bpm ?? existing?.bpm ?? 120,
        tracks: body.tracks ?? existing?.tracks ?? [],
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await this.ctx.storage.put("timeline", updated);

      const msg = JSON.stringify({ type: "timeline_update", data: updated });
      for (const ws of this.sessions) {
        try {
          ws.send(msg);
        } catch {
          this.sessions.delete(ws);
        }
      }

      return Response.json(updated);
    }

    return new Response("Not found", { status: 404 });
  }

  override webSocketClose(ws: WebSocket) {
    this.sessions.delete(ws);
  }
}
