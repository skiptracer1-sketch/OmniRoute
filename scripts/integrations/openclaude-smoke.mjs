import { buildOpenClaudeEnv } from "./openclaude-bridge.mjs";

const DEFAULT_BASE_URL = "http://localhost:20128/v1";
const DEFAULT_MODEL = "auto";

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export async function smokeOpenClaudeGateway(options = {}) {
  const baseUrl = stripTrailingSlash(options.baseUrl || DEFAULT_BASE_URL);
  const rootUrl = baseUrl.replace(/\/v1$/, "");
  const model = options.model || DEFAULT_MODEL;
  const apiKey = options.apiKey || "";
  const timeoutMs = Number(options.timeoutMs || 5000);
  const fetchImpl = options.fetchImpl || fetch;

  try {
    const health = await fetchImpl(`${rootUrl}/api/monitoring/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!health.ok) {
      return { ok: false, stage: "health", error: `OmniRoute health check failed with HTTP ${health.status}` };
    }

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const completion = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with exactly: pong" }],
        stream: false,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!completion.ok) {
      return {
        ok: false,
        stage: "completion",
        error: `OmniRoute chat completion failed with HTTP ${completion.status}`,
      };
    }

    const payload = await completion.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      return { ok: false, stage: "completion", error: "OmniRoute returned no assistant content" };
    }

    return { ok: true, stage: "complete", model, content };
  } catch (error) {
    return { ok: false, stage: "network", error: error?.message || String(error) };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bridgeEnv = buildOpenClaudeEnv({
    ...process.env,
    OPENAI_API_KEY: process.env.OMNIROUTE_API_KEY,
  });
  const result = await smokeOpenClaudeGateway({
    baseUrl: bridgeEnv.OPENAI_BASE_URL,
    model: bridgeEnv.OPENAI_MODEL,
    apiKey: bridgeEnv.OPENAI_API_KEY,
  });
  if (result.ok) {
    console.log(`OpenClaude gateway smoke passed: model=${result.model}, reply=${JSON.stringify(result.content)}`);
    process.exitCode = 0;
  } else {
    console.error(`OpenClaude gateway smoke failed at ${result.stage}: ${result.error}`);
    process.exitCode = 1;
  }
}
