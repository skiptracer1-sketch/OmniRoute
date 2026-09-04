"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/shared/components";

type HealthState = "checking" | "online" | "offline";

type HealthSnapshot = {
  state: HealthState;
  latencyMs: number | null;
  checkedAt: Date | null;
};

type BrainMissionPulse = {
  id: string;
  businessUnitId: string;
  title: string;
  phase: string;
  status: string;
  progress: number;
};

type BrainDecisionPulse = {
  id: string;
  missionId: string;
  taskId: string;
  title: string;
  requestedAt: string;
};

type BrainPulse = {
  schemaVersion: 1;
  activeMissions: number;
  activeTasks: number;
  pendingDecisions: number;
  blockers: number;
  failures: number;
  recoveries: number;
  queueDepth: number;
  missions: BrainMissionPulse[];
  decisions: BrainDecisionPulse[];
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

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function BrainMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-subtle p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black tabular-nums text-text-main">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{detail}</p>
    </div>
  );
}

export default function RuntimePulse() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot>({
    state: "checking",
    latencyMs: null,
    checkedAt: null,
  });
  const [brainPulse, setBrainPulse] = useState<BrainPulse | null>(null);
  const [brainError, setBrainError] = useState<string | null>(null);

  const probe = useCallback(async () => {
    const started = performance.now();

    const gatewayPromise = fetch("/api/monitoring/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const brainPromise = fetch("/api/lumexus/brain/runtime-pulse", {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });

    try {
      const response = await gatewayPromise;
      const latencyMs = Math.max(1, Math.round(performance.now() - started));
      setSnapshot({
        state: response.ok ? "online" : "offline",
        latencyMs,
        checkedAt: new Date(),
      });
    } catch {
      setSnapshot({ state: "offline", latencyMs: null, checkedAt: new Date() });
    }

    try {
      const response = await brainPromise;
      if (!response.ok) throw new Error(`Brain pulse returned ${response.status}`);
      const payload = (await response.json()) as BrainPulse;
      setBrainPulse(payload);
      setBrainError(null);
    } catch (error) {
      setBrainPulse(null);
      setBrainError(error instanceof Error ? error.message : "Brain pulse unavailable");
    }
  }, []);

  useEffect(() => {
    void probe();
    const timer = setInterval(() => void probe(), POLL_MS);
    return () => clearInterval(timer);
  }, [probe]);

  const dialUnit = snapshot.state === "online" && snapshot.latencyMs != null ? "ms" : "status";
  const checkingClass = snapshot.state === "checking" ? "animate-pulse" : "";
  const openClaudeRoute = snapshot.state === "online" ? "Gateway reachable" : "Gateway unavailable";

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">speed</span>
                <h2 className="text-lg font-semibold">Runtime Pulse</h2>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Live OmniRoute gateway health plus Lumexus Brain control-plane telemetry.
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-border bg-bg-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Gateway</p>
                <p className="mt-2 text-base font-semibold text-text-main">
                  {getGatewayLabel(snapshot.state)}
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
                <p className="mt-2 text-base font-semibold text-text-main">{openClaudeRoute}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Configured for OmniRoute /v1; OpenClaude process status is not independently probed here.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-bg-subtle p-4 sm:col-span-2 xl:col-span-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-text-muted">{formatCheckedAt(snapshot.checkedAt)}</p>
                  <p className="text-xs font-medium text-text-muted">
                    Gateway status is directly probed. Brain metrics below are projected from current Lumexus Brain runtime state.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">neurology</span>
                <h2 className="text-lg font-semibold">Lumexus Brain Core</h2>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Mission execution, Decision Queue, blockers, recovery, and verified progress projection.
              </p>
            </div>
            <div className="rounded-full border border-border bg-bg-subtle px-3 py-1 text-xs font-semibold text-text-muted">
              {brainPulse ? `schema v${brainPulse.schemaVersion}` : "pulse unavailable"}
            </div>
          </div>

          {brainError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-500">
              Lumexus Brain telemetry unavailable: {brainError}
            </div>
          ) : brainPulse ? (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
                <BrainMetric label="Missions" value={brainPulse.activeMissions} detail="active" />
                <BrainMetric label="Tasks" value={brainPulse.activeTasks} detail="in flight" />
                <BrainMetric label="Queue" value={brainPulse.queueDepth} detail="ready / retry" />
                <BrainMetric label="Decisions" value={brainPulse.pendingDecisions} detail="Crazy E queue" />
                <BrainMetric label="Blockers" value={brainPulse.blockers} detail="needs attention" />
                <BrainMetric label="Failures" value={brainPulse.failures} detail="runtime events" />
                <BrainMetric label="Recoveries" value={brainPulse.recoveries} detail="successful" />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-border bg-bg-subtle p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text-main">Mission progress</h3>
                    <span className="text-xs text-text-muted">{brainPulse.missions.length} total</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {brainPulse.missions.length === 0 ? (
                      <p className="text-sm text-text-muted">No missions are registered in the current Brain runtime.</p>
                    ) : (
                      brainPulse.missions.slice(0, 8).map((mission) => {
                        const progress = clampPercent(mission.progress);
                        return (
                          <div key={mission.id} className="rounded-lg border border-border bg-bg-main p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-text-main">{mission.title}</p>
                                <p className="mt-0.5 text-xs text-text-muted">
                                  {mission.businessUnitId} · {mission.phase} · {mission.status}
                                </p>
                              </div>
                              <span className="text-sm font-black tabular-nums text-text-main">{progress}%</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/60">
                              <div
                                className="h-full rounded-full bg-primary transition-[width] duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-bg-subtle p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text-main">Crazy E Decision Queue</h3>
                    <span className="text-xs text-text-muted">{brainPulse.pendingDecisions} pending</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {brainPulse.decisions.length === 0 ? (
                      <p className="text-sm text-text-muted">No high-impact decisions are waiting for approval.</p>
                    ) : (
                      brainPulse.decisions.slice(0, 8).map((decision) => (
                        <div key={decision.id} className="rounded-lg border border-border bg-bg-main p-3">
                          <p className="text-sm font-semibold text-text-main">{decision.title}</p>
                          <p className="mt-1 text-xs text-text-muted">
                            Mission {decision.missionId} · Task {decision.taskId}
                          </p>
                          <p className="mt-1 text-[11px] text-text-muted">Requested {decision.requestedAt}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-bg-subtle p-4 text-sm text-text-muted">
              Loading Lumexus Brain runtime projection…
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
