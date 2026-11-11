// Vite dev-server plugin exposing the Corti Agentic Framework behind
// /api/corti/*. Adapted from corti-eg-demo's server/cortiAgentServer.ts.
//
// - Credentials live in .env, server-side only — never shipped to the browser.
// - Vite does NOT auto-load .env into process.env for plugin code: loadEnv().
// - One persistent agent, found/created by name. The systemPrompt is PATCHed
//   on every reuse, so prompt edits (and regenerated taxonomy) propagate.
// - Connectors are set only at creation — schema changes need a new agent
//   name (hence the -v1 suffix in COMPOSER_AGENT_NAME).

import { Plugin } from "vite";
import { loadEnv } from "vite";
import { CortiClient } from "@corti/sdk";
import {
  COMPOSER_AGENT_NAME,
  COMPOSER_AGENT_DESCRIPTION,
  COMPOSER_SCHEMA,
  composerSystemPrompt,
} from "../src/agent/composerAgent";
import { CAPABILITIES } from "../src/data/capabilities";

interface AgentSpec {
  name: string;
  description: string;
  systemPrompt: string;
  schema: Record<string, unknown>;
}

const COMPOSER_SPEC = (): AgentSpec => ({
  name: COMPOSER_AGENT_NAME,
  description: COMPOSER_AGENT_DESCRIPTION,
  systemPrompt: composerSystemPrompt(),
  schema: COMPOSER_SCHEMA,
});

let client: CortiClient | null = null;

function describeError(err: unknown): string {
  if (err instanceof Error) {
    const anyErr = err as Error & { statusCode?: number; status?: number; body?: unknown; requestId?: string };
    const status = anyErr.statusCode ?? anyErr.status;
    const body =
      typeof anyErr.body === "string"
        ? anyErr.body.slice(0, 500)
        : anyErr.body
          ? JSON.stringify(anyErr.body).slice(0, 500)
          : "";
    const parts = [err.message];
    if (status) parts.push(`HTTP ${status}`);
    if (body) parts.push(body);
    if (anyErr.requestId) parts.push(`requestId: ${anyErr.requestId}`);
    return parts.join(" | ");
  }
  return String(err);
}

async function readJson(req: { method?: string }): Promise<Record<string, unknown>> {
  // Vite dev server exposes the raw node req; read the body manually.
  const chunks: Buffer[] = [];
  const nodeReq = req as unknown as NodeJS.ReadableStream;
  await new Promise<void>((resolve, reject) => {
    nodeReq.on("data", (c: Buffer) => chunks.push(c));
    nodeReq.on("end", () => resolve());
    nodeReq.on("error", reject);
  });
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

// One agent, created once per tenant and reused (persistent lifecycle).
async function ensureAgent(c: CortiClient, spec: AgentSpec): Promise<string> {
  const page = await c.agentic.agents.list();
  const items = (page as any)?.response?.agents ?? [];
  for (const a of items) {
    if (a?.name === spec.name) {
      // Keep the agent's prompt in sync with this file.
      await c.agentic.agents.update(a.id, { systemPrompt: spec.systemPrompt } as any);
      return a.id as string;
    }
  }
  const created = await c.agentic.agents.create({
    name: spec.name,
    description: spec.description,
    systemPrompt: spec.systemPrompt,
    lifecycle: "persistent",
    connectors: [
      {
        type: "schema",
        name: "respond",
        description: "Submit the structured response.",
        schema: spec.schema,
        transition: "complete",
      } as any,
    ],
  } as any);
  return created.id as string;
}

// The agent's reply can arrive in several places depending on the task state.
function extractAgentText(resp: any): string {
  // 1. Schema connector's parsed object (check first — it's not text).
  const artifacts = resp?.task?.artifacts ?? [];
  for (const art of artifacts) {
    for (const part of art?.parts ?? []) {
      if (part?.data && typeof part.data === "object") return JSON.stringify(part.data);
      if (typeof part?.text === "string" && part.text.trim()) return part.text;
    }
  }
  // 2. Task history — last agent message.
  const history = resp?.task?.history ?? [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]?.role !== "ROLE_AGENT") continue;
    for (const part of history[i]?.parts ?? []) {
      if (typeof part?.text === "string" && part.text.trim()) return part.text;
    }
  }
  // 3. Task status message.
  const statusParts = resp?.task?.status?.message?.parts ?? [];
  for (const part of statusParts) {
    if (typeof part?.text === "string" && part.text.trim()) return part.text;
  }
  // 4. Plain message reply.
  const parts = resp?.message?.parts ?? [];
  for (const part of parts) {
    if (typeof part?.text === "string" && part.text.trim()) return part.text;
  }
  return "";
}

function parseAgentJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown fences before giving up.
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(stripped);
  }
}

async function runAgent(payload: unknown): Promise<any> {
  if (!client) throw new Error("Corti credentials not configured (.env)");
  const spec = COMPOSER_SPEC();
  const agentId = await ensureAgent(client, spec);
  const resp = await client.agentic.agents.sendMessage(
    agentId,
    {
      // SDK default of 0 returns empty history — must set this.
      historyLength: 2,
      message: {
        role: "ROLE_USER",
        messageId: `msg.${crypto.randomUUID()}`,
        parts: [{ text: JSON.stringify(payload) }],
      },
    } as any,
  );
  const text = extractAgentText(resp);
  if (!text) throw new Error("Agent returned no text");
  return parseAgentJson(text);
}

export function cortiAgentServer(): Plugin {
  return {
    name: "corti-agent-server",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root ?? process.cwd(), "");
      const clientId = env.CORTI_CLIENT_ID ?? "";
      const clientSecret = env.CORTI_CLIENT_SECRET ?? "";
      const tenant = env.CORTI_TENANT ?? "";
      const cluster = (env.CORTI_ENVIRONMENT ?? "eu").toLowerCase();

      if (clientId && clientSecret && tenant) {
        client = new CortiClient({
          environment: cluster === "us" ? "us" : "eu",
          tenantName: tenant,
          clientId,
          clientSecret,
        } as any);
      } else {
        client = null;
      }

      server.middlewares.use("/api/corti/status", (_req, res) => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ configured: client !== null }));
      });

      server.middlewares.use("/api/corti/compose", async (req, res) => {
        res.setHeader("content-type", "application/json");
        try {
          if (!client) {
            res.statusCode = 503;
            res.end(JSON.stringify({ error: "Corti credentials not configured (.env)" }));
            return;
          }
          const body = await readJson(req as unknown as { method?: string });
          const goal = typeof body.goal === "string" ? body.goal.trim() : "";
          if (!goal) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "goal is required" }));
            return;
          }
          // Taxonomy rides in the message body — token-cheap, trace self-contained.
          const payload = {
            goal,
            taxonomy: CAPABILITIES.map((c) => ({ id: c.id, name: c.name, whenToUse: c.whenToUse, keywords: c.keywords })),
          };
          const result = await runAgent(payload);
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: describeError(err) }));
        }
      });
    },
  };
}
