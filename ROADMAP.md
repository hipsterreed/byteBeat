# ByteBeat — Hackathon Roadmap
> ElevenLabs × Cloudflare Hackathon | Submission deadline: check hacks.elevenlabs.io

---

## Vision

**ByteBeat** is a browser-based, AI-powered MIDI pad controller and sequencer.
Users arrange neon/pastel sound pads, build multi-track timelines, and co-produce
music in real-time — with an AI DJ agent that can suggest loops, generate new
sounds via ElevenLabs, and remix your session on command.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Vite + React + TypeScript | Fast dev, great ecosystem |
| Styling | Tailwind CSS + custom CSS vars | Neon/pastel theming, dark mode |
| Audio Engine | Web Audio API + Tone.js | Scheduling, effects, MIDI |
| MIDI I/O | WebMIDI API | Real hardware controller support |
| API Runtime | Elysia on Cloudflare Workers | Edge-first, Bun-compatible |
| Persistence | Cloudflare Durable Objects | Stateful session + timeline |
| Sound Storage | Cloudflare R2 | Pre-baked + generated audio |
| Caching | Cloudflare KV | Generated audio blob cache |
| Sound Search | Cloudflare Vectorize | Semantic "find me a punchy kick" |
| AI Inference | Cloudflare Workers AI | Local LLM for agent logic |
| Voice/Sound Gen | ElevenLabs TTS + Sound Effects | On-demand sound generation |
| Collab | WebSocket via Durable Objects | Real-time multi-user jam |
| Deploy (FE) | Cloudflare Pages | CDN-hosted, instant preview URLs |

---

## Cloudflare Features Utilized

| Feature | Usage |
|---|---|
| **Workers** | All API routes, agent logic, audio proxy |
| **Durable Objects** | `SessionDurableObject` (pad layout, BPM), `TimelineDurableObject` (multi-track state + WS hub) |
| **R2** | Store pre-baked ElevenLabs audio files + user-generated sounds |
| **KV** | Cache ElevenLabs API responses (audio URLs keyed by prompt hash) |
| **Vectorize** | Embed sound metadata; semantic search ("give me something ethereal") |
| **Workers AI** | Run inference for the DJ Agent (sound suggestions, timeline analysis) |
| **Browser Rendering** | Generate shareable session screenshots / OG images |
| **Pages** | Host the Vite frontend |
| **WebSockets (DO)** | Live collab — see other users' pad hits in real-time |

---

## ElevenLabs Features Utilized

| Feature | Usage |
|---|---|
| **Text-to-Speech** | Generate vocal samples from text (e.g. "say 'lets go' in a hype voice") |
| **Sound Effects API** | Generate percussion, synth hits, FX from text prompts |
| **Voice Cloning** | User uploads voice → clone → use as instrument pad |
| **Conversational AI (optional)** | Voice-controlled DJ agent you can talk to |

---

## Project Structure

```
byteBeat/
├── apps/
│   └── bytebeat_client/          # Vite + React frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── PadGrid/      # 4×4 neon pad controller
│       │   │   ├── Timeline/     # Multi-track sequencer
│       │   │   ├── SoundBrowser/ # Browse/search sounds
│       │   │   ├── AgentPanel/   # AI DJ agent chat UI
│       │   │   └── Toolbar/      # BPM, key, transport controls
│       │   ├── hooks/
│       │   │   ├── useAudioEngine.ts
│       │   │   ├── useMidi.ts
│       │   │   └── useSession.ts
│       │   ├── stores/           # Zustand state
│       │   └── lib/
│       │       ├── audioEngine.ts
│       │       └── api.ts
│       └── public/sounds/        # Placeholder audio files
│
└── services/
    └── bytebeat_api/             # Elysia on Cloudflare Workers
        ├── src/
        │   ├── index.ts          # Worker entry + route registration
        │   ├── routes/
        │   │   ├── sounds.ts     # Sound library CRUD
        │   │   ├── generate.ts   # ElevenLabs generation proxy
        │   │   ├── session.ts    # DO-backed session routes
        │   │   ├── timeline.ts   # DO-backed timeline routes
        │   │   ├── agent.ts      # DJ agent (Workers AI + ElevenLabs)
        │   │   └── search.ts     # Vectorize semantic search
        │   ├── durable-objects/
        │   │   ├── SessionDurableObject.ts
        │   │   └── TimelineDurableObject.ts
        │   └── lib/
        │       ├── elevenlabs.ts # ElevenLabs SDK wrapper
        │       └── vectorize.ts  # Sound embedding helpers
        └── wrangler.toml
```

---

## Milestones

### Phase 1 — Foundation (Day 1 Morning)
- [x] Scaffold Vite client (`apps/bytebeat_client`)
- [x] Scaffold Elysia Worker service (`services/bytebeat_api`)
- [x] `SessionDurableObject` and `TimelineDurableObject` stubs
- [x] `wrangler.toml` with all CF bindings declared
- [ ] Install frontend deps: Tailwind, Tone.js, Zustand, Framer Motion
- [ ] Basic Elysia routes: `/health`, `/sounds`
- [ ] Deploy skeleton to CF Workers + Pages

### Phase 2 — Core UI (Day 1 Afternoon)
- [ ] **PadGrid** — 4×4 grid, neon/pastel color per pad, press animation
- [ ] **Audio Engine** — load sounds into Web Audio API, trigger on pad press
- [ ] **Toolbar** — BPM knob, play/stop transport, key selector
- [ ] Pre-baked sound pack (9 placeholder sounds in `/public/sounds/`)
- [ ] Assign sounds to pads via drag-and-drop or click-to-assign

### Phase 3 — Timeline Sequencer (Day 1 Evening)
- [ ] **Timeline** — horizontal multi-track view, 1 bar = N pixels
- [ ] Record pad hits onto the timeline (loop recording)
- [ ] Playback engine synchronized to BPM
- [ ] Track mute/solo, volume fader per track
- [ ] Export timeline state to `TimelineDurableObject`

### Phase 4 — Cloudflare Integration (Day 2 Morning)
- [ ] `SessionDurableObject` — save/load pad layout by session ID (shareable URL)
- [ ] `TimelineDurableObject` — persist timeline; WebSocket broadcast for collab
- [ ] R2 — serve pre-baked audio files from bucket
- [ ] KV — cache ElevenLabs generated audio (key = SHA256 of prompt)
- [ ] Vectorize — index all 9 sounds with embeddings; wire up semantic search UI

### Phase 5 — ElevenLabs Integration (Day 2 Afternoon)
- [ ] **Sound Effects generation** — text prompt → ElevenLabs Sound Effects API → R2 → pad
- [ ] **TTS vocal pads** — type text → ElevenLabs TTS → assign to pad
- [ ] **Voice Clone pad** — upload 30s voice clip → clone → generate phrase → pad
- [ ] Generated sounds stored in R2, cached in KV, embedded into Vectorize

### Phase 6 — AI DJ Agent (Day 2 Late Afternoon)
- [ ] Agent route in Worker using `@cloudflare/agents` SDK
- [ ] Workers AI (llama model) analyses current timeline + available sounds
- [ ] Agent can: suggest next sound, fill empty bars, adjust BPM, name your track
- [ ] Frontend `AgentPanel` — chat bubble UI, shows agent suggestions inline
- [ ] Agent can call ElevenLabs to generate a sound on the fly

### Phase 7 — Polish + Viral Video (Day 3)
- [ ] Neon glow animations on pad hit (CSS box-shadow pulse)
- [ ] Waveform visualizer on active pads (Web Audio AnalyserNode)
- [ ] Shareable session link (DO session ID in URL)
- [ ] Cloudflare Browser Rendering → generate OG preview card of your beat
- [ ] Record a demo beat, export timeline, film the viral video
- [ ] Deploy final build to CF Pages + Workers

---

## UI Design Notes

### Color System
```
Background:     #0a0a0f  (near-black)
Surface:        #12121a
Border:         #1e1e2e
Pad colors:     Rotating neon/pastel palette
  - Hot pink:   #ff6ec7
  - Lavender:   #a78bfa
  - Cyan:       #67e8f9
  - Mint:       #86efac
  - Yellow:     #fde68a
  - Orange:     #fb923c
  - Red:        #f87171
  - Purple:     #c084fc
```

### Pad States
- **Idle**: muted neon color, subtle glow border
- **Hover**: brighter glow, slight scale up
- **Active/Playing**: full brightness, pulsing box-shadow ring
- **Recording**: red tint overlay on pad

### Layout
```
┌─────────────────────────────────────────────────────┐
│  BYTEBEAT        BPM [120] ▶ ■    Key [C]    🤖 AI │
├──────────────────────────┬──────────────────────────┤
│                          │                          │
│    4×4 PAD GRID          │    SOUND BROWSER         │
│    (main interaction)    │    (search + assign)     │
│                          │                          │
├──────────────────────────┴──────────────────────────┤
│                                                     │
│    TIMELINE SEQUENCER (multi-track, scrollable)     │
│                                                     │
├─────────────────────────────────────────────────────┤
│    AI DJ AGENT PANEL (collapsible)                  │
└─────────────────────────────────────────────────────┘
```

---

## Pre-baked Sound List (placeholders — replace with real ElevenLabs exports)

| ID | Name | Category | ElevenLabs Prompt |
|---|---|---|---|
| `kick_01` | Deep Kick | drums | "deep punchy kick drum hit" |
| `snare_01` | Crisp Snare | drums | "crisp snare drum crack" |
| `hihat_01` | Closed Hi-Hat | drums | "tight closed hi-hat cymbal tick" |
| `hihat_open` | Open Hi-Hat | drums | "open hi-hat cymbal sizzle" |
| `bass_01` | 808 Bass | synth | "deep 808 sub bass hit" |
| `lead_01` | Synth Lead | synth | "bright synth lead stab" |
| `vocal_oh` | Vocal Oh | vocal | "female vocal hit oh" |
| `vocal_ah` | Vocal Ah | vocal | "choir vocal ah swell" |
| `fx_riser` | Riser FX | fx | "electronic riser whoosh buildup" |
| `fx_drop` | Drop FX | fx | "bass drop impact explosion" |

---

## Environment Variables

```env
# Worker (wrangler secret put)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=default

# Frontend (.env.local)
VITE_API_URL=https://bytebeat-api.your-subdomain.workers.dev
VITE_WS_URL=wss://bytebeat-api.your-subdomain.workers.dev
```

---

## Key API Endpoints

| Method | Path | DO | Description |
|---|---|---|---|
| GET | `/sounds` | — | List all sounds in library |
| POST | `/sounds/generate` | — | Generate sound via ElevenLabs |
| GET | `/search?q=...` | — | Vectorize semantic sound search |
| GET | `/session/:id` | SessionDO | Load pad layout |
| PUT | `/session/:id` | SessionDO | Save pad layout |
| GET | `/timeline/:id` | TimelineDO | Load timeline |
| PUT | `/timeline/:id` | TimelineDO | Save timeline |
| WS | `/timeline/:id/ws` | TimelineDO | Real-time collab WebSocket |
| POST | `/agent/suggest` | — | AI DJ suggestion |
| GET | `/render/:id` | — | Browser Rendering OG card |
