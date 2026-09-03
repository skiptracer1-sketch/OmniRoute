"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/shared/components";

type HealthState = "checking" | "online" | "offline";

type HealthSnapshot = {
  state: HealthState;
  latencyMs: number | null;
  checkedAt: Date | null;
};

const POLL_MS = 5000;

function formatCheckedAt(value: Date | null) {
  if (!value) return "Waiting for first probe";
  return `Checked ${value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

export default function RuntimePulse() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot>({
    state: "checking",
    latencyMs: null,
    checkedAt: null,
  });

  const probe = useCallback(async () => {
    const started = performance.now();
    try {
      const response = await fetch("/api/monitoring/health", {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      const latencyMs = Math.max(1, Math.round(performance.now() - started));
      setSnapshot({
        state: response.ok ? "online" : "offline",
        latencyMs,
        checkedAt: new Date(),
      });
    } catch {
      setSnapshot({ state: "offline", latencyMs: null, checkedAt: new Date() });
    }
  }, []);

  useEffect(() => {
    void probe();
    const timer = setInterval(() => void probe(), POLL_MS);
    return () => clearInterval(timer);
  }, [probe]);

  const stateLabel =
    snapshot.state === "online" ? "ONLINE" : snapshot.state === "offline" ? "OFFLINE" : "CHECKING";
  const dialValue = snapshot.state === "online" ? 360 : snapshot.state === "checking" ? 72 : 0;
  const dialText =
    snapshot.state === "online"
      ? snapshot.latencyMs == null
        ? "ON"
        : `${snapshot.latencyMs}`
      : snapshot.state === "offline"
        ? "OFF"
        : "…";
  const dialUnit = snapshot.state === "online" && snapshot.latencyMs != null ? "ms" : "status";
  const ariaLabel =
    snapshot.state === "online"
      ? `OmniRoute gateway online${snapshot.latencyMs == null ? "" : `, ${snapshot.latencyMs} millisecond probe latency`}`
      : snapshot.state === "offline"
        ? "OmniRoute gateway offline"
        : "OmniRoute gateway health check in progress";

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
              className={`relative flex size-36 items-center justify-center rounded-full ${
                snapshot.state === "checking" ? "animate-pulse" : ""
              }`}
              style={{
                background: `conic-gradient(var(--color-primary, currentColor) ${dialValue}deg, color-mix(in srgb, currentColor 10%, transparent) 0deg)`,
              }}
              aria-label={ariaLabel}
            >
              <div className="flex size-28 flex-col items-center justify-center rounded-full border border-border bg-bg-main">
                <span className="text-3xl font-black tabular-nums text-text-main">{dialText}</span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                  {dialUnit}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold">
              <span
                className={`size-2 rounded-full ${
                  snapshot.state === "online"
                    ? "bg-green-500"
                    : snapshot.state === "offline"
                      ? "bg-red-500"
                      : "bg-amber-500 animate-pulse"
                }`}
              />
              {stateLabel}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Gateway</p>
              <p className="mt-2 text-base font-semibold text-text-main">
                {snapshot.state === "online" ? "Healthy" : snapshot.state === "offline" ? "Unavailable" : "Probing"}
              </p>
              <p className="mt-1 text-xs text-text-muted">/api/monitoring/health</p>
            </div>

            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Probe latency</p>
              <p className="mt-2 text-base font-semibold tabular-nums text-text-main">
                {snapshot.latencyMs == null ? "—" : `${snapshot.latencyMs} ms`}
              </p>
              <p className="mt-1 text-xs text-text-muted">Measured every 5 seconds</p>
            </div>

            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">OpenClaude route</p>
              <p className="mt-2 text-base font-semibold text-text-main">
                {snapshot.state === "online" ? "Gateway reachable" : "Gateway unavailable"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Configured for OmniRoute /v1; OpenClaude process status is not independently probed here.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-subtle p-4 sm:col-span-2 xl:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-text-muted">{formatCheckedAt(snapshot.checkedAt)}</p>
                <p className="text-xs font-medium text-text-muted">
                  Only gateway health and probe latency are measured. Agent/job progress requires persisted runtime events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
