# ByteBeat — Infrastructure Diagram

## URLs

| Environment | Service | URL |
|---|---|---|
| Production | Worker API | `https://bytebeat-api.jamesarroyo5.workers.dev` |
| Production | Frontend | `https://bytebeat-client.pages.dev` *(after Pages deploy)* |
| Local dev | Worker API | `http://localhost:8787` |
| Local dev | Frontend | `http://localhost:5173` |

**Cloudflare Account ID:** `58dc9ef6a3a1ca00034f0c751d6796c3`
**workers.dev subdomain:** `jamesarroyo5.workers.dev`

---

## Hosting Summary

| Thing | What it is | Hosted on |
|---|---|---|
| `apps/bytebeat_client` | React UI | Cloudflare Pages |
| `services/bytebeat_api` | Elysia Worker (API) | Cloudflare Workers |
| Audio files (.mp3) | Generated + pre-baked sounds | Cloudflare R2 |
| Sound metadata cache | Fast key/value lookups | Cloudflare KV |
| Session + Timeline state | Durable Objects | Cloudflare Durable Objects |
| Semantic sound search | Vector embeddings | Cloudflare Vectorize |
| DJ Agent inference | LLM running at the edge | Cloudflare Workers AI |
| Sound/Voice generation | ElevenLabs API | ElevenLabs (external) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │           bytebeat_client  (Cloudflare Pages)           │   │
│   │                                                         │   │
│   │   PadGrid  │  Timeline  │  SoundBrowser  │  AgentPanel  │   │
│   └──────┬─────────────┬──────────────────────────┬─────────┘   │
│          │  REST/WS    │  stream audio from R2    │             │
└──────────┼─────────────┼──────────────────────────┼─────────────┘
           │             │                          │
           ▼             │                          │
┌──────────────────────────────────────────────────┼─────────────┐
│          │    CLOUDFLARE EDGE                     │             │
│          │                                        │             │
│   ┌──────▼───────────────────────────────────┐   │             │
│   │     bytebeat_api  (Cloudflare Workers)   │   │             │
│   │                                          │   │             │
│   │   /sounds      /session    /timeline     │   │             │
│   │   /generate    /search     /agent        │   │             │
│   └──┬──────┬───────────┬───────────┬────────┘   │             │
│      │      │           │           │            │             │
│      ▼      ▼           ▼           ▼            ▼             │
│   ┌─────┐ ┌────┐  ┌──────────┐ ┌────────┐  ┌────────┐        │
│   │ R2  │ │ KV │  │ Durable  │ │Vector- │  │Workers │        │
│   │     │ │    │  │ Objects  │ │  ize   │  │   AI   │        │
│   │.mp3 │ │meta│  │          │ │        │  │        │        │
│   │files│ │data│  │Session DO│ │sound   │  │DJ Agent│        │
│   │     │ │    │  │Timeline  │ │search  │  │ (LLM)  │        │
│   │     │ │    │  │    DO    │ │        │  │        │        │
│   └──▲──┘ └────┘  └──────────┘ └────────┘  └────────┘        │
│      │                                                         │
└──────┼─────────────────────────────────────────────────────────┘
       │
       │  (Worker writes audio here after generation)
       │
       ▼
┌─────────────────────┐
│   ElevenLabs API    │
│   (external)        │
│                     │
│  Sound Effects API  │
│  Text-to-Speech     │
│  Voice Cloning      │
└─────────────────────┘
```

---

## Request Flows

### User prompts a new sound
```
Browser → POST /generate  (Worker)
            → ElevenLabs Sound Effects API
              → audio bytes returned
                → Worker stores bytes in R2
                  → Worker saves metadata in KV
                    → Worker returns { soundId, r2Url }
                      → Browser plays audio from R2 URL
```

### User opens a saved session
```
Browser → GET /session/:id  (Worker)
            → SessionDurableObject.fetch()
              → reads pad layout from DO storage
                → returns JSON to browser
                  → UI renders pads with saved colors/sounds
```

### Real-time collab on timeline
```
Browser A ──WebSocket──┐
                       ▼
Browser B ──WebSocket──► TimelineDurableObject  (single instance, CF edge)
                       │
                       └── broadcasts updates to all connected clients
```

### DJ Agent suggests a sound
```
Browser → POST /agent/suggest  (Worker)
            → Workers AI (llama) analyses current timeline
              → decides what sound to generate
                → calls ElevenLabs Sound Effects API
                  → stores in R2/KV
                    → returns suggestion + new sound to browser
```

### Semantic sound search
```
Browser → GET /search?q=ethereal pad  (Worker)
            → Workers AI embeds the query text
              → Vectorize searches nearest sound embeddings
                → returns ranked sound list to browser
```
