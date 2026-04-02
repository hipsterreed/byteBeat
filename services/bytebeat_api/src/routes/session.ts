import { Hono } from "hono";
import type { Bindings } from "../types";

const app = new Hono<{ Bindings: Bindings }>();

function getStub(env: Bindings, sessionId: string) {
  const id = env.SESSION_DO.idFromName(sessionId);
  return env.SESSION_DO.get(id);
}

app.get("/session/:id", async (c) => {
  try {
    const stub = getStub(c.env, c.req.param("id"));
    const res = await stub.fetch("http://do/session");
    if (!res.ok) return c.json(null, 200);
    const data = await res.json();
    return c.json(data);
  } catch (e) {
    console.error("Session GET error:", e);
    return c.json(null, 200); // return null so frontend starts fresh
  }
});

app.put("/session/:id", async (c) => {
  try {
    const body = await c.req.json();
    const stub = getStub(c.env, c.req.param("id"));
    const res = await stub.fetch("http://do/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return c.json(data);
  } catch (e) {
    console.error("Session PUT error:", e);
    return c.json({ error: String(e) }, 500);
  }
});

export { app as sessionRoutes };
