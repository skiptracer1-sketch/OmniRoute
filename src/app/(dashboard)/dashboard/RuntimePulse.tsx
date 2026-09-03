"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/shared/components";

type HealthState = "checking" | "online" | "offline";

type LumexusAstraStatus = {
  provider: "openai";
  candidateModel: string;
  fallbackModel: string;
  apiModelIdVerified: false;
  state: "candidate_unverified" | "candidate_locked";
  fallbackActive: boolean;
  lockoutReason: string | null;
  lockoutRemainingMs: number | null;
  failureCount: number;
};

type HealthSnapshot = {
  state: HealthState;
  latencyMs: number | null;
  checkedAt: Date | null;
  astra: LumexusAstraStatus | null;
};

type HealthPayload = {
  lumexusAstra?: LumexusAstraStatus;
};

const POLL_MS = 5000;

function formatCheckedAt(value: Date | null) {
  if (!value) return "Waiting for first probe";
  return `Checked ${value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

function getStateLabel(state: HealthState) {
  if (state === "online") return "ONLINE";
  if (state === "offline") return "OFFLINE";
  return "CHECKING";
}

function getDialValue(state: HealthState) {
  if (state === "online") return 360;
  if (state === "checking") return 72;
  return 0;
}

function getDialText(snapshot: HealthSnapshot) {
  if (snapshot.state === "offline") return "OFF";
  if (snapshot.state === "checking") return "…";
  if (snapshot.latencyMs == null) return "ON";
  return String(snapshot.latencyMs);
}

function getAriaLabel(snapshot: HealthSnapshot) {
  if (snapshot.state === "offline") return "OmniRoute gateway offline";
  if (snapshot.state === "checking") return "OmniRoute gateway health check in progress";
  if (snapshot.latencyMs == null) return "OmniRoute gateway online";
  return `OmniRoute gateway online, ${snapshot.latencyMs} millisecond probe latency`;
}

function getStatusDotClass(state: HealthState) {
  if (state === "online") return "bg-green-500";
  if (state === "offline") return "bg-red-500";
  return "bg-amber-500 animate-pulse";
}

function getGatewayLabel(state: HealthState) {
  if (state === "online") return "Healthy";
  if (state === "offline") return "Unavailable";
  return "Probing";
}

function getAstraLabel(status: LumexusAstraStatus | null) {
  if (!status) return "Telemetry unavailable";
  if (status.state === "candidate_locked") return "Sol fallback active";
  return "Astra candidate ready";
}

function getAstraDetail(status: LumexusAstraStatus | null) {
  if (!status) return "Astra routing telemetry is not available from the gateway.";
  if (status.state === "candidate_locked") {
    const cooldownSeconds =
      status.lockoutRemainingMs == null ? null : Math.ceil(status.lockoutRemainingMs / 1000);
    const cooldownText = cooldownSeconds == null ? "" : ` for ~${cooldownSeconds}s`;
    const reasonText = status.lockoutReason ? ` (${status.lockoutReason})` : "";
    return `${status.candidateModel} is cooling down${cooldownText}${reasonText}; routing falls through to ${status.fallbackModel}.`;
  }
  return `${status.candidateModel} is configured as an unverified API candidate; ${status.fallbackModel} is the verified fallback.`;
}

export default function RuntimePulse() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot>({
    state: "checking",
    latencyMs: null,
    checkedAt: null,
    astra: null,
  });

  const probe = useCallback(async () => {
    const started = performance.now();
    try {
      const response = await fetch("/api/monitoring/health", {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      const latencyMs = Math.max(1, Math.round(performance.now() - started));
      const payload = response.ok
        ? ((await response.json().catch(() => null)) as HealthPayload | null)
        : null;
      setSnapshot({
        state: response.ok ? "online" : "offline",
        latencyMs,
        checkedAt: new Date(),
        astra: payload?.lumexusAstra ?? null,
      });
    } catch {
      setSnapshot({
        state: "offline",
        latencyMs: null,
        checkedAt: new Date(),
        astra: null,
      });
    }
  }, []);

  useEffect(() => {
    void probe();
    const timer = setInterval(() => void probe(), POLL_MS);
    return () => clearInterval(timer);
  }, [probe]);

  const dialUnit = snapshot.state === "online" && snapshot.latencyMs != null ? "ms" : "status";
  const checkingClass = snapshot.state === "checking" ? "animate-pulse" : "";
  const openClaudeRoute =
    snapshot.state === "online" ? "Gateway reachable" : "Gateway unavailable";

  return (
    <Card>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">speed</span>
              <h2 className="text-lg font-semibold">Runtime Pulse</h2>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Live OmniRoute gateway health and routing-path telemetry.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void probe()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-xs font-semibold text-text-main transition-colors hover:border-primary/40 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Probe now
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-subtle p-5">
            <div
              className={`relative flex size-36 items-center justify-center rounded-full ${checkingClass}`}
              style={{
                background: `conic-gradient(var(--color-primary, currentColor) ${getDialValue(snapshot.state)}deg, color-mix(in srgb, currentColor 10%, transparent) 0deg)`,
              }}
              aria-label={getAriaLabel(snapshot)}
            >
              <div className="flex size-28 flex-col items-center justify-center rounded-full border border-border bg-bg-main">
                <span className="text-3xl font-black tabular-nums text-text-main">
                  {getDialText(snapshot)}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                  {dialUnit}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
              <span className={`size-2 rounded-full ${getStatusDotClass(snapshot.state)}`} />
              {getStateLabel(snapshot.state)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Gateway</p>
              <p className="mt-2 text-base font-semibold text-text-main">
                {getGatewayLabel(snapshot.state)}
              </p>
              <p className="mt-1 text-xs text-text-muted">/api/monitoring/health</p>
            </div>

            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Probe latency
              </p>
              <p className="mt-2 text-base font-semibold tabular-nums text-text-main">
                {snapshot.latencyMs == null ? "—" : `${snapshot.latencyMs} ms`}
              </p>
              <p className="mt-1 text-xs text-text-muted">Measured every 5 seconds</p>
            </div>

            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                OpenClaude route
              </p>
              <p className="mt-2 text-base font-semibold text-text-main">{openClaudeRoute}</p>
              <p className="mt-1 text-xs text-text-muted">
                Configured for OmniRoute /v1; OpenClaude process status is not independently
                probed here.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Lumexus premium route
              </p>
              <p className="mt-2 text-base font-semibold text-text-main">
                {getAstraLabel(snapshot.astra)}
              </p>
              <p className="mt-1 text-xs text-text-muted">{getAstraDetail(snapshot.astra)}</p>
            </div>

            <div className="rounded-xl border border-border bg-bg-subtle p-4 sm:col-span-2 xl:col-span-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-text-muted">{formatCheckedAt(snapshot.checkedAt)}</p>
                <p className="text-xs font-medium text-text-muted">
                  Astra status reflects OmniRoute model-lockout telemetry only. It does not claim
                  OpenAI API entitlement or independently verify the candidate model ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
