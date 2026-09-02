export type ReactorConfig = {
  apiKey: string;
  tokenEndpoint: string;
  maxSessionsPerToken: number;
};

const DEFAULT_TOKEN_ENDPOINT = "https://api.reactor.inc/tokens";
const DEFAULT_MAX_SESSIONS = 2;

export function getReactorConfig(): ReactorConfig {
  const apiKey = process.env.REACTOR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Reactor is not configured: REACTOR_API_KEY is missing");
  }

  const maxSessionsRaw = Number(process.env.REACTOR_MAX_SESSIONS_PER_TOKEN ?? DEFAULT_MAX_SESSIONS);
  const maxSessionsPerToken = Number.isFinite(maxSessionsRaw)
    ? Math.max(1, Math.min(10, Math.floor(maxSessionsRaw)))
    : DEFAULT_MAX_SESSIONS;

  return {
    apiKey,
    tokenEndpoint: process.env.REACTOR_TOKEN_ENDPOINT?.trim() || DEFAULT_TOKEN_ENDPOINT,
    maxSessionsPerToken,
  };
}
