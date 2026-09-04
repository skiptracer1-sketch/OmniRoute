"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ProviderConnection = {
  isActive?: boolean;
  testStatus?: string | null;
  lastError?: string | null;
  rateLimitedUntil?: string | null;
};

type CallLog = {
  status?: number;
  error?: string | null;
  active?: boolean;
};

type MeterState = {
  providers: ProviderConnection[];
  callLogs: CallLog[];
  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
};

function providerHealthy(provider: ProviderConnection) {
  if (!provider.isActive) return false;
  if (provider.rateLimitedUntil && new Date(provider.rateLimitedUntil).getTime() > Date.now()) return false;
  if (provider.lastError) return false;
  return provider.testStatus === "success" || provider.testStatus === "healthy";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function LiveReadinessMeter() {
  const [state, setState] = useState<MeterState>({
    providers: [],
    callLogs: [],
    loading: true,
    error: null,
    updatedAt: null,
  });

  const refresh = useCallback(async () => {
    try {
      const [providersRes, logsRes] = await Promise.all([
        fetch("/api/providers", { cache: "no-store" }),
        fetch("/api/usage/call-logs?limit=40", { cache: "no-store" }),
      ]);

      if (!providersRes.ok || !logsRes.ok) throw new Error("Live readiness telemetry unavailable");

      const providersJson = (await providersRes.json()) as { connections?: ProviderConnection[] };
      const logsJson = (await logsRes.json()) as CallLog[];

      setState({
        providers: Array.isArray(providersJson.connections) ? providersJson.connections : [],
        callLogs: Array.isArray(logsJson) ? logsJson : [],
        loading: false,
        error: null,
        updatedAt: new Date(),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Live readiness telemetry unavailable",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const metrics = useMemo(() => {
    const activeProviders = state.providers.filter((provider) => provider.isActive);
    const healthyProviders = activeProviders.filter(providerHealthy);
    const providerScore = activeProviders.length
      ? (healthyProviders.length / activeProviders.length) * 100
      : 0;

    const completedLogs = state.callLogs.filter((log) => !log.active);
    const successfulLogs = completedLogs.filter(
      (log) => !log.error && (!log.status || (log.status >= 200 && log.status < 400))
    );
    const requestScore = completedLogs.length
      ? (successfulLogs.length / completedLogs.length) * 100
      : activeProviders.length
        ? 100
        : 0;

    const score = clamp(providerScore * 0.65 + requestScore * 0.35);
    const attention = Math.max(0, activeProviders.length - healthyProviders.length);

    return {
      score,
      activeProviders: activeProviders.length,
      healthyProviders: healthyProviders.length,
      attention,
      recentErrors: completedLogs.length - successfulLogs.length,
    };
  }, [state.providers, state.callLogs]);

  const status = state.error
    ? "Telemetry degraded"
    : metrics.score >= 90
      ? "Mission ready"
      : metrics.score >= 75
        ? "Operational"
        : metrics.score >= 50
          ? "Needs attention"
          : "Degraded";

  const needleRotation = -90 + metrics.score * 1.8;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Live readiness</p>
          <h2 className="mt-1 text-lg font-bold text-text-main">OmniRoute Health Speedometer</h2>
          <p className="mt-1 text-sm text-text-muted">
            Auto-updates every 15 seconds from provider health and recent request success telemetry.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-lg border border-border bg-bg-alt px-3 py-2 text-xs font-semibold text-text-main transition hover:bg-surface"
        >
          Refresh now
        </button>
      </div>

      <div className="mt-6 grid items-center gap-6 lg:grid-cols-[280px_1fr]">
        <div className="mx-auto w-full max-w-[280px]">
          <div className="relative aspect-[2/1] overflow-hidden">
            <div className="absolute inset-x-0 top-0 aspect-square rounded-full border-[18px] border-border/50 border-b-transparent border-l-primary/70 border-r-primary/30" />
            <div
              className="absolute bottom-0 left-1/2 h-[42%] w-1 origin-bottom rounded-full bg-text-main transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
            />
            <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full border-4 border-surface bg-primary" />
            <div className="absolute inset-x-0 bottom-5 text-center">
              <div className="text-4xl font-black tabular-nums text-text-main">{state.loading ? "—" : metrics.score}</div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">readiness %</div>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="rounded-full border border-border bg-bg-alt px-3 py-1 text-xs font-bold text-text-main">{status}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-bg-alt/40 p-4">
            <div className="text-2xl font-bold text-text-main">{metrics.healthyProviders}/{metrics.activeProviders}</div>
            <div className="mt-1 text-xs text-text-muted">healthy active providers</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-bg-alt/40 p-4">
            <div className="text-2xl font-bold text-text-main">{metrics.attention}</div>
            <div className="mt-1 text-xs text-text-muted">providers needing attention</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-bg-alt/40 p-4">
            <div className="text-2xl font-bold text-text-main">{metrics.recentErrors}</div>
            <div className="mt-1 text-xs text-text-muted">errors in recent request window</div>
          </div>
          <div className="rounded-xl border border-border/70 bg-bg-alt/40 p-4">
            <div className="text-sm font-bold text-text-main">{state.updatedAt ? state.updatedAt.toLocaleTimeString() : "Waiting for telemetry"}</div>
            <div className="mt-1 text-xs text-text-muted">last live update</div>
          </div>
        </div>
      </div>

      {state.error ? <div className="mt-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">{state.error}</div> : null}
    </section>
  );
}
