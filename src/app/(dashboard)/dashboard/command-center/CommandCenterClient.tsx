"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/shared/components/Card";

type ProviderConnection = {
  id: string;
  name?: string | null;
  provider: string;
  isActive?: boolean;
  testStatus?: string | null;
  lastError?: string | null;
  rateLimitedUntil?: string | null;
  defaultModel?: string | null;
};

type UtilizationPoint = {
  provider: string;
  remainingPct: number;
  timestamp: string;
};

type UtilizationResponse = {
  providers: string[];
  data: UtilizationPoint[];
};

type AuditEntry = {
  id?: string;
  action?: string;
  timestamp?: string;
  createdAt?: string;
  actor?: string;
};

type CallLog = {
  id?: string;
  timestamp?: string;
  status?: number;
  model?: string | null;
  requestedModel?: string | null;
  provider?: string | null;
  providerDisplay?: string | null;
  account?: string | null;
  duration?: number;
  tokens?: { in?: number; out?: number } | null;
  error?: string | null;
  active?: boolean;
  completed?: boolean;
};

type ProviderAnalytics = {
  provider: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  avgLatencyMs: number;
  successRatePct: number | string;
  cost: number;
};

type AnalyticsResponse = {
  summary?: {
    totalRequests?: number;
    totalTokens?: number;
    totalCost?: number;
    fallbackRatePct?: number;
    fallbacks?: number;
  };
  byProvider?: ProviderAnalytics[];
};

type RoutingMode = "balanced" | "fastest" | "cheapest" | "reliable";

function latestUtilization(points: UtilizationPoint[]) {
  const map = new Map<string, UtilizationPoint>();
  for (const point of points) {
    const current = map.get(point.provider);
    if (!current || new Date(point.timestamp).getTime() > new Date(current.timestamp).getTime()) {
      map.set(point.provider, point);
    }
  }
  return map;
}

function statusLabel(connection: ProviderConnection) {
  if (!connection.isActive) return "Disabled";
  if (connection.rateLimitedUntil && new Date(connection.rateLimitedUntil).getTime() > Date.now()) {
    return "Rate limited";
  }
  if (connection.testStatus === "success" || connection.testStatus === "healthy") return "Healthy";
  if (connection.testStatus === "failed" || connection.lastError) return "Attention";
  return "Unknown";
}

function numberValue(value: number | string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function scoreProvider(row: ProviderAnalytics, mode: RoutingMode) {
  const success = Math.max(0, Math.min(100, numberValue(row.successRatePct)));
  const latencyScore = Math.max(0, 100 - Math.min(100, row.avgLatencyMs / 25));
  const requestCost = row.requests > 0 ? row.cost / row.requests : 0;
  const costScore = Math.max(0, 100 - Math.min(100, requestCost * 5000));

  if (mode === "fastest") return latencyScore * 0.7 + success * 0.25 + costScore * 0.05;
  if (mode === "cheapest") return costScore * 0.7 + success * 0.2 + latencyScore * 0.1;
  if (mode === "reliable") return success * 0.8 + latencyScore * 0.15 + costScore * 0.05;
  return success * 0.5 + latencyScore * 0.3 + costScore * 0.2;
}

function formatCost(value: number | undefined) {
  return `$${numberValue(value).toFixed(4)}`;
}

function formatTokens(value: number | undefined) {
  return new Intl.NumberFormat().format(numberValue(value));
}

export default function CommandCenterClient() {
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [utilization, setUtilization] = useState<UtilizationResponse | null>(null);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [routingMode, setRoutingMode] = useState<RoutingMode>("balanced");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providersRes, utilizationRes, activityRes, callLogsRes, analyticsRes] = await Promise.all([
        fetch("/api/providers", { cache: "no-store" }),
        fetch("/api/usage/utilization?range=24h&aggregateBy=provider", { cache: "no-store" }),
        fetch("/api/compliance/audit-log?level=high&limit=25", { cache: "no-store" }),
        fetch("/api/usage/call-logs?limit=30", { cache: "no-store" }),
        fetch("/api/usage/analytics?range=1d", { cache: "no-store" }),
      ]);

      if (!providersRes.ok) throw new Error("Provider status failed to load");
      if (!utilizationRes.ok) throw new Error("Usage telemetry failed to load");
      if (!activityRes.ok) throw new Error("Activity log failed to load");
      if (!callLogsRes.ok) throw new Error("Request stream failed to load");
      if (!analyticsRes.ok) throw new Error("Analytics failed to load");

      const providersJson = (await providersRes.json()) as { connections?: ProviderConnection[] };
      const utilizationJson = (await utilizationRes.json()) as UtilizationResponse;
      const activityJson = (await activityRes.json()) as AuditEntry[];
      const callLogsJson = (await callLogsRes.json()) as CallLog[];
      const analyticsJson = (await analyticsRes.json()) as AnalyticsResponse;

      setConnections(Array.isArray(providersJson.connections) ? providersJson.connections : []);
      setUtilization(utilizationJson);
      setActivity(Array.isArray(activityJson) ? activityJson : []);
      setCallLogs(Array.isArray(callLogsJson) ? callLogsJson : []);
      setAnalytics(analyticsJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Command Center failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const usageByProvider = useMemo(
    () => latestUtilization(utilization?.data ?? []),
    [utilization?.data]
  );

  const rankedProviders = useMemo(
    () =>
      [...(analytics?.byProvider ?? [])]
        .map((row) => ({ ...row, score: scoreProvider(row, routingMode) }))
        .sort((a, b) => b.score - a.score),
    [analytics?.byProvider, routingMode]
  );

  const healthyCount = connections.filter((connection) => statusLabel(connection) === "Healthy").length;
  const activeCount = connections.filter((connection) => connection.isActive).length;
  const attentionCount = connections.filter((connection) => {
    const status = statusLabel(connection);
    return status === "Attention" || status === "Rate limited";
  }).length;
  const activeRequests = callLogs.filter((log) => log.active).length;
  const errorRequests = callLogs.filter((log) => numberValue(log.status) >= 400 || Boolean(log.error)).length;

  const toggleProvider = useCallback(
    async (connection: ProviderConnection) => {
      setSavingId(connection.id);
      setError(null);
      try {
        const response = await fetch(`/api/providers/${encodeURIComponent(connection.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !connection.isActive }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message =
            payload && typeof payload.error === "string" ? payload.error : "Provider update failed";
          throw new Error(message);
        }
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Provider update failed");
      } finally {
        setSavingId(null);
      }
    },
    [refresh]
  );

  const modes: Array<{ id: RoutingMode; label: string }> = [
    { id: "balanced", label: "Smart Balanced" },
    { id: "fastest", label: "Fastest" },
    { id: "cheapest", label: "Cheapest" },
    { id: "reliable", label: "Max Reliability" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Lumexus AI Ops</p>
          <h1 className="mt-1 text-2xl font-bold text-text-main">OmniRoute Command Center</h1>
          <p className="mt-1 max-w-3xl text-sm text-text-muted">
            Live provider health, cost, tokens, latency, fallback activity, request telemetry, and authenticated provider controls from OmniRoute native APIs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-main transition hover:bg-bg-alt disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh live data"}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card title="Active providers" subtitle="Eligible for routing" icon="hub">
          <div className="text-3xl font-bold text-text-main">{activeCount}</div>
          <div className="mt-1 text-xs text-text-muted">of {connections.length} configured</div>
        </Card>
        <Card title="Healthy now" subtitle="Connection health" icon="health_and_safety">
          <div className="text-3xl font-bold text-text-main">{healthyCount}</div>
          <div className="mt-1 text-xs text-text-muted">{attentionCount} need attention</div>
        </Card>
        <Card title="Requests" subtitle="Last 24 hours" icon="swap_horiz">
          <div className="text-3xl font-bold text-text-main">{formatTokens(analytics?.summary?.totalRequests)}</div>
          <div className="mt-1 text-xs text-text-muted">{activeRequests} active now</div>
        </Card>
        <Card title="Tokens" subtitle="Last 24 hours" icon="data_usage">
          <div className="text-3xl font-bold text-text-main">{formatTokens(analytics?.summary?.totalTokens)}</div>
          <div className="mt-1 text-xs text-text-muted">prompt + completion</div>
        </Card>
        <Card title="Cost" subtitle="Last 24 hours" icon="payments">
          <div className="text-3xl font-bold text-text-main">{formatCost(analytics?.summary?.totalCost)}</div>
          <div className="mt-1 text-xs text-text-muted">real pricing analytics</div>
        </Card>
        <Card title="Fallback rate" subtitle="Routing resilience" icon="alt_route">
          <div className="text-3xl font-bold text-text-main">{numberValue(analytics?.summary?.fallbackRatePct).toFixed(1)}%</div>
          <div className="mt-1 text-xs text-text-muted">{formatTokens(analytics?.summary?.fallbacks)} fallbacks</div>
        </Card>
      </div>

      <Card title="Routing intelligence" subtitle="Live scoring view — recommendations only until OmniRoute exposes a strategy-write endpoint" icon="route">
        <div className="mb-4 flex flex-wrap gap-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setRoutingMode(mode.id)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                routingMode === mode.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-muted hover:text-text-main"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <tr><th className="px-3 py-3">Rank</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Success</th><th className="px-3 py-3">Latency</th><th className="px-3 py-3">Requests</th><th className="px-3 py-3">Cost</th></tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {rankedProviders.slice(0, 10).map((row, index) => (
                <tr key={`${row.provider}-${index}`}>
                  <td className="px-3 py-3 font-semibold text-text-main">#{index + 1}</td>
                  <td className="px-3 py-3 font-medium text-text-main">{row.provider}</td>
                  <td className="px-3 py-3 text-primary">{row.score.toFixed(1)}</td>
                  <td className="px-3 py-3 text-text-muted">{numberValue(row.successRatePct).toFixed(1)}%</td>
                  <td className="px-3 py-3 text-text-muted">{row.avgLatencyMs} ms</td>
                  <td className="px-3 py-3 text-text-muted">{formatTokens(row.requests)}</td>
                  <td className="px-3 py-3 text-text-muted">{formatCost(row.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Provider control plane" subtitle="Live health + 24-hour quota headroom" icon="dns">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-3 py-3">Connection</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Model</th><th className="px-3 py-3">Health</th><th className="px-3 py-3">Quota remaining</th><th className="px-3 py-3 text-right">Routing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {connections.map((connection) => {
                const status = statusLabel(connection);
                const usage = usageByProvider.get(connection.provider);
                return (
                  <tr key={connection.id} className="text-text-main">
                    <td className="px-3 py-3 font-medium">{connection.name || connection.id}</td>
                    <td className="px-3 py-3 text-text-muted">{connection.provider}</td>
                    <td className="px-3 py-3 text-text-muted">{connection.defaultModel || "Auto"}</td>
                    <td className="px-3 py-3"><span className="rounded-full border border-border px-2 py-1 text-xs">{status}</span></td>
                    <td className="px-3 py-3">{usage ? `${Math.round(usage.remainingPct)}%` : "No snapshot"}</td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" onClick={() => void toggleProvider(connection)} disabled={savingId === connection.id} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-bg-alt disabled:opacity-50">
                        {savingId === connection.id ? "Saving…" : connection.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && connections.length === 0 ? <tr><td className="px-3 py-8 text-center text-text-muted" colSpan={6}>No provider connections found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Live request stream" subtitle={`${activeRequests} active · ${errorRequests} recent errors in loaded window`} icon="stream">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <tr><th className="px-3 py-3">Time</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Model</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Latency</th><th className="px-3 py-3">Tokens</th><th className="px-3 py-3">Account</th></tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {callLogs.slice(0, 15).map((log, index) => {
                const totalTokens = numberValue(log.tokens?.in) + numberValue(log.tokens?.out);
                const failed = numberValue(log.status) >= 400 || Boolean(log.error);
                return (
                  <tr key={log.id || `${log.timestamp || "request"}-${index}`}>
                    <td className="px-3 py-3 text-text-muted">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}</td>
                    <td className="px-3 py-3 text-text-main">{log.providerDisplay || log.provider || "—"}</td>
                    <td className="px-3 py-3 text-text-muted">{log.model || log.requestedModel || "Auto"}</td>
                    <td className={`px-3 py-3 ${failed ? "text-error" : log.active ? "text-primary" : "text-text-muted"}`}>{log.active ? "LIVE" : failed ? log.status || "ERR" : log.status || "OK"}</td>
                    <td className="px-3 py-3 text-text-muted">{numberValue(log.duration)} ms</td>
                    <td className="px-3 py-3 text-text-muted">{formatTokens(totalTokens)}</td>
                    <td className="px-3 py-3 text-text-muted">{log.account || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="High-priority activity" subtitle="Latest management and routing-relevant audit events" icon="monitoring">
        <div className="space-y-2">
          {activity.slice(0, 10).map((entry, index) => {
            const stamp = entry.timestamp || entry.createdAt;
            return (
              <div key={entry.id || `${entry.action || "event"}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-bg-alt/40 px-3 py-3">
                <div><div className="font-medium text-text-main">{entry.action || "Audit event"}</div><div className="text-xs text-text-muted">{entry.actor || "system"}</div></div>
                <div className="text-xs text-text-muted">{stamp ? new Date(stamp).toLocaleString() : "Timestamp unavailable"}</div>
              </div>
            );
          })}
          {!loading && activity.length === 0 ? <div className="py-8 text-center text-sm text-text-muted">No high-priority activity yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
