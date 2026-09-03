/**
 * Lumexus Astra-ready routing metadata.
 *
 * GPT-6 Astra is publicly referenced by OpenAI, while its public API model ID is
 * not yet present in the OpenAI API model catalog as of 2026-09-03. OmniRoute
 * therefore treats `gpt-6-astra` as an explicitly unverified candidate ID and
 * relies on its existing exact-model lockout + family fallback machinery to
 * fail safely to GPT-5.6 Sol when the candidate is unavailable or unauthorized.
 *
 * Do not place API keys, tokens, connection IDs, or other credentials in the
 * status object returned from this module. It is intentionally safe for the
 * Runtime Pulse dashboard.
 */

export const LUMEXUS_ASTRA_CANDIDATE_MODEL = "gpt-6-astra";
export const LUMEXUS_FALLBACK_MODEL = "gpt-5.6-sol";
export const LUMEXUS_OPENAI_PROVIDER = "openai";

export type LumexusAstraState = "candidate_unverified" | "candidate_locked";

export type LumexusAstraLockout = {
  provider?: string | null;
  model?: string | null;
  reason?: string | null;
  remainingMs?: number | null;
  failureCount?: number | null;
  connectionId?: string | null;
};

export type LumexusAstraRuntimeStatus = {
  provider: typeof LUMEXUS_OPENAI_PROVIDER;
  candidateModel: typeof LUMEXUS_ASTRA_CANDIDATE_MODEL;
  fallbackModel: typeof LUMEXUS_FALLBACK_MODEL;
  apiModelIdVerified: false;
  state: LumexusAstraState;
  fallbackActive: boolean;
  lockoutReason: string | null;
  lockoutRemainingMs: number | null;
  failureCount: number;
};

function normalize(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Project a sanitized Astra routing status from OmniRoute's existing exact-model
 * lockout telemetry. Multiple OpenAI connections can lock the same model; the
 * entry with the longest remaining cooldown is the most conservative snapshot.
 */
export function getLumexusAstraRuntimeStatus(
  lockouts: readonly LumexusAstraLockout[]
): LumexusAstraRuntimeStatus {
  const matching = lockouts
    .filter(
      (entry) =>
        normalize(entry.provider) === LUMEXUS_OPENAI_PROVIDER &&
        normalize(entry.model) === LUMEXUS_ASTRA_CANDIDATE_MODEL
    )
    .sort((a, b) => Number(b.remainingMs ?? 0) - Number(a.remainingMs ?? 0));

  const active = matching[0] ?? null;
  const fallbackActive = Boolean(active);

  return {
    provider: LUMEXUS_OPENAI_PROVIDER,
    candidateModel: LUMEXUS_ASTRA_CANDIDATE_MODEL,
    fallbackModel: LUMEXUS_FALLBACK_MODEL,
    apiModelIdVerified: false,
    state: fallbackActive ? "candidate_locked" : "candidate_unverified",
    fallbackActive,
    lockoutReason: active?.reason ? String(active.reason) : null,
    lockoutRemainingMs:
      typeof active?.remainingMs === "number" && Number.isFinite(active.remainingMs)
        ? Math.max(0, Math.round(active.remainingMs))
        : null,
    failureCount:
      typeof active?.failureCount === "number" && Number.isFinite(active.failureCount)
        ? Math.max(0, Math.round(active.failureCount))
        : 0,
  };
}
