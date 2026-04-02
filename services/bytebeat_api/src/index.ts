import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings } from "./types";
import { PREBAKED_SOUNDS, handleGenerate, handleAudioServe, handleCommunitySounds } from "./routes/sounds";
import { handleAgentSuggest } from "./routes/agent";
import { sessionRoutes } from "./routes/session";

export { SessionDurableObject } from "./durable-objects/SessionDurableObject";
export { TimelineDurableObject } from "./durable-objects/TimelineDurableObject";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok", service: "bytebeat_api" }));

app.get("/sounds", (c) => c.json({ sounds: PREBAKED_SOUNDS }));

app.get("/sounds/community", async (c) => {
  const result = await handleCommunitySounds(c.env);
  return c.json(result);
});

app.post("/sounds/generate", async (c) => {
  const { prompt, name } = await c.req.json<{ prompt: string; name?: string }>();
  if (!prompt?.trim()) return c.json({ error: "prompt is required" }, 400);
  try {
    const result = await handleGenerate(c.env, prompt.trim(), name?.trim());
    return c.json(result);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Generation failed" }, 500);
  }
});

app.get("/audio/*", async (c) => {
  const key = c.req.path.replace(/^\/audio\//, "");
  return handleAudioServe(c.env, key);
});

app.post("/agent/suggest", async (c) => {
  const { message, context } = await c.req.json<{
    message: string;
    context: { pads: { id: string; label: string; soundName: string | null; color: string }[]; bpm: number };
  }>();
  if (!message?.trim()) return c.json({ error: "message is required" }, 400);
  try {
    const result = await handleAgentSuggest(c.env, message.trim(), context);
    return c.json(result);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Agent failed" }, 500);
  }
});

app.route("/", sessionRoutes);

export default app;
