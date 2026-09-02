import { getReactorConfig } from "./config";
import { ReactorError, normalizeReactorUpstreamError } from "./errors";
import { getReactorModel } from "./models";

export type MintReactorTokenOptions = {
  maxSessions?: number;
};

export type ReactorTokenResult = {
  token: string;
  reactorModel: string;
  expiresAt?: string;
};

export async function mintReactorToken(
  modelId: string,
  options: MintReactorTokenOptions = {}
): Promise<ReactorTokenResult> {
  const model = getReactorModel(modelId);
  if (!model) {
    throw new ReactorError(
      "REACTOR_MODEL_UNSUPPORTED",
      `Unsupported Reactor model: ${modelId}`,
      400
    );
  }

  const config = getReactorConfig();
  const maxSessions = Math.max(
    1,
    Math.min(options.maxSessions ?? config.maxSessionsPerToken, config.maxSessionsPerToken)
  );

  let response: Response;
  try {
    response = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: {
        "Reactor-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authorization_details: [
          {
            type: "session",
            resources: { models: { match: [model.reactorModel] } },
            constraints: { max_sessions: maxSessions },
          },
        ],
      }),
      cache: "no-store",
    });
  } catch {
    throw new ReactorError(
      "REACTOR_UPSTREAM_UNAVAILABLE",
      "Unable to reach Reactor token service",
      503
    );
  }

  if (!response.ok) {
    throw normalizeReactorUpstreamError(response.status);
  }

  const payload = (await response.json()) as {
    jwt?: string;
    expires_at?: string;
    expiresAt?: string;
  };

  if (!payload.jwt) {
    throw new ReactorError(
      "REACTOR_AUTH_FAILED",
      "Reactor token service returned no session token",
      502
    );
  }

  return {
    token: payload.jwt,
    reactorModel: model.reactorModel,
    expiresAt: payload.expires_at ?? payload.expiresAt,
  };
}
