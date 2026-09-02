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
  details?: unknown;
};

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

export default function CommandCenterClient() {
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [utilization, setUtilization] = useState<UtilizationResponse | null>(null);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [providersRes, utilizationRes, activityRes] = await Promise.all([
        fetch("/api/providers", { cache: "no-store" }),
        fetch("/api/usage/utilization?range=24h&aggregateBy=provider", { cache: "no-store" }),
        fetch("/api/compliance/audit-log?level=high&limit=25", { cache: "no-store" }),
      ]);

      if (!providersRes.ok) throw new Error("Provider status failed to load");
      if (!utilizationRes.ok) throw new Error("Usage telemetry failed to load");
      if (!activityRes.ok) throw new Error("Activity log failed to load");

      const providersJson = (await providersRes.json()) as { connections?: ProviderConnection[] };
      const utilizationJson = (await utilizationRes.json()) as UtilizationResponse;
      const activityJson = (await activityRes.json()) as AuditEntry[];

      setConnections(Array.isArray(providersJson.connections) ? providersJson.connections : []);
      setUtilization(utilizationJson);
      setActivity(Array.isArray(activityJson) ? activityJson : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Command Center failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const usageByProvider = useMemo(
    () => latestUtilization(utilization?.data ?? []),
    [utilization?.data]
  );

  const healthyCount = connections.filter((connection) => statusLabel(connection) === "Healthy").length;
  const activeCount = connections.filter((connection) => connection.isActive).length;
  const attentionCount = connections.filter((connection) => {
    const status = statusLabel(connection);
    return status === "Attention" || status === "Rate limited";
  }).length;

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Lumexus AI Ops</p>
          <h1 className="mt-1 text-2xl font-bold text-text-main">OmniRoute Command Center</h1>
          <p className="mt-1 max-w-3xl text-sm text-text-muted">
            Live provider health, quota headroom, high-priority activity, and authenticated routing controls from OmniRoute's native APIs.
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Active providers" subtitle="Connections currently eligible for routing" icon="hub">
          <div className="text-3xl font-bold text-text-main">{activeCount}</div>
          <div className="mt-1 text-xs text-text-muted">of {connections.length} configured</div>
        </Card>
        <Card title="Healthy now" subtitle="Provider connection test state" icon="health_and_safety">
          <div className="text-3xl font-bold text-text-main">{healthyCount}</div>
          <div className="mt-1 text-xs text-text-muted">passing current health state</div>
        </Card>
        <Card title="Needs attention" subtitle="Errors or active rate-limit windows" icon="warning">
          <div className="text-3xl font-bold text-text-main">{attentionCount}</div>
          <div className="mt-1 text-xs text-text-muted">actionable routing risk</div>
        </Card>
      </div>

      <Card title="Provider control plane" subtitle="Live health + 24-hour quota headroom" icon="dns">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-3 py-3">Connection</th>
                <th className="px-3 py-3">Provider</th>
                <th className="px-3 py-3">Model</th>
                <th className="px-3 py-3">Health</th>
                <th className="px-3 py-3">Quota remaining</th>
                <th className="px-3 py-3 text-right">Routing</th>
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
                    <td className="px-3 py-3">
                      <span className="rounded-full border border-border px-2 py-1 text-xs">{status}</span>
                    </td>
                    <td className="px-3 py-3">
                      {usage ? `${Math.round(usage.remainingPct)}%` : "No snapshot"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void toggleProvider(connection)}
                        disabled={savingId === connection.id}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:bg-bg-alt disabled:opacity-50"
                      >
                        {savingId === connection.id
                          ? "Saving…"
                          : connection.isActive
                            ? "Disable"
                            : "Enable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && connections.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-text-muted" colSpan={6}>
                    No provider connections found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="High-priority activity" subtitle="Latest management and routing-relevant audit events" icon="monitoring">
        <div className="space-y-2">
          {activity.slice(0, 12).map((entry, index) => {
            const stamp = entry.timestamp || entry.createdAt;
            return (
              <div
                key={entry.id || `${entry.action || "event"}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-bg-alt/40 px-3 py-3"
              >
                <div>
                  <div className="font-medium text-text-main">{entry.action || "Audit event"}</div>
                  <div className="text-xs text-text-muted">{entry.actor || "system"}</div>
                </div>
                <div className="text-xs text-text-muted">
                  {stamp ? new Date(stamp).toLocaleString() : "Timestamp unavailable"}
                </div>
              </div>
            );
          })}
          {!loading && activity.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">No high-priority activity yet.</div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
