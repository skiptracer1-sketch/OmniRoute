import { launchOpenClaude } from "../../../scripts/integrations/openclaude-bridge.mjs";

const DEFAULT_BASE_URL = "http://localhost:20128/v1";
const DEFAULT_MODEL = "auto";

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export function resolveOpenClaudeTarget(opts = {}) {
  const baseUrl =
    opts.baseUrl ||
    opts["base-url"] ||
    process.env.OMNIROUTE_OPENCLAUDE_BASE_URL ||
    DEFAULT_BASE_URL;
  const model = opts.model || process.env.OMNIROUTE_OPENCLAUDE_MODEL || DEFAULT_MODEL;
  const apiKey =
    opts.apiKey ||
    opts["api-key"] ||
    process.env.OMNIROUTE_OPENCLAUDE_API_KEY ||
    process.env.OMNIROUTE_API_KEY ||
    "omniroute-local";
  return { baseUrl: stripTrailingSlash(baseUrl), model, apiKey };
}

export function buildOpenClaudeBridgeEnv(baseEnv = process.env, target) {
  return {
    ...baseEnv,
    OMNIROUTE_OPENCLAUDE_BASE_URL: target.baseUrl,
    OMNIROUTE_OPENCLAUDE_MODEL: target.model,
    OMNIROUTE_OPENCLAUDE_API_KEY: target.apiKey,
  };
}

export async function checkOpenClaudeGateway(baseUrl, timeoutMs = 3000) {
  const root = stripTrailingSlash(baseUrl).replace(/\/v1$/, "");
  try {
    const response = await fetch(`${root}/api/monitoring/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function runOpenClaudeCommand(opts = {}, args = []) {
  const target = resolveOpenClaudeTarget(opts);
  if (!opts.skipHealthCheck && !(await checkOpenClaudeGateway(target.baseUrl))) {
    console.error(
      `OmniRoute is not reachable through ${target.baseUrl}. Start it with 'omniroute serve' or pass --skip-health-check for a remote/custom gateway.`
    );
    return 1;
  }

  const env = buildOpenClaudeBridgeEnv(process.env, target);
  let child;
  try {
    child = launchOpenClaude(args, { env });
  } catch (error) {
    console.error(`OpenClaude launch failed: ${error?.message || error}`);
    return 1;
  }

  return await new Promise((resolve) => {
    child.once("error", (error) => {
      console.error(`OpenClaude launch failed: ${error?.message || error}`);
      resolve(error?.code === "ENOENT" ? 127 : 1);
    });
    child.once("exit", (code) => resolve(code ?? 0));
  });
}

export function registerOpenClaude(program, dependencies = {}) {
  const run = dependencies.run || runOpenClaudeCommand;
  program
    .command("openclaude")
    .description("Launch OpenClaude with OmniRoute as its OpenAI-compatible model gateway")
    .option("--base-url <url>", "OmniRoute OpenAI-compatible base URL", DEFAULT_BASE_URL)
    .option("--model <model>", "OmniRoute model/combo exposed to OpenClaude", DEFAULT_MODEL)
    .option("--api-key <key>", "OmniRoute API key for this OpenClaude session")
    .option("--skip-health-check", "Launch without checking the OmniRoute gateway first")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .argument("[openclaudeArgs...]", "arguments passed through to OpenClaude")
    .action(async (openclaudeArgs, opts) => {
      process.exitCode = await run(opts, openclaudeArgs ?? []);
    });
}
