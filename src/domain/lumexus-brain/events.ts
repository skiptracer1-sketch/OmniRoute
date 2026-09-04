import { randomUUID } from "node:crypto";
import type { BusinessUnitId } from "./types.ts";

/**
 * Canonical runtime registry for Lumexus Brain event identifiers.
 *
 * Keeping the runtime values and TypeScript type sourced from the same object
 * prevents documentation, validators, and event producers from drifting apart.
 */
export const BRAIN_EVENT_TYPES = {
  MISSION_CREATED: "MISSION_CREATED",
  MISSION_UPDATED: "MISSION_UPDATED",
  MISSION_COMPLETED: "MISSION_COMPLETED",
  TASK_CREATED: "TASK_CREATED",
  TASK_READY: "TASK_READY",
  TASK_STARTED: "TASK_STARTED",
  TASK_COMPLETED: "TASK_COMPLETED",
  TASK_FAILED: "TASK_FAILED",
  AGENT_STARTED: "AGENT_STARTED",
  AGENT_COMPLETED: "AGENT_COMPLETED",
  AGENT_FAILED: "AGENT_FAILED",
  MODEL_ROUTE_SELECTED: "MODEL_ROUTE_SELECTED",
  MODEL_FALLBACK: "MODEL_FALLBACK",
  TOOL_CALL_STARTED: "TOOL_CALL_STARTED",
  TOOL_CALL_COMPLETED: "TOOL_CALL_COMPLETED",
  TOOL_CALL_FAILED: "TOOL_CALL_FAILED",
  TEST_STARTED: "TEST_STARTED",
  TEST_PASSED: "TEST_PASSED",
  TEST_FAILED: "TEST_FAILED",
  VERIFICATION_PASSED: "VERIFICATION_PASSED",
  VERIFICATION_FAILED: "VERIFICATION_FAILED",
  DEPLOY_STARTED: "DEPLOY_STARTED",
  DEPLOY_SUCCEEDED: "DEPLOY_SUCCEEDED",
  DEPLOY_FAILED: "DEPLOY_FAILED",
  SERVICE_DEGRADED: "SERVICE_DEGRADED",
  SERVICE_FAILED: "SERVICE_FAILED",
  RECOVERY_STARTED: "RECOVERY_STARTED",
  RECOVERY_SUCCEEDED: "RECOVERY_SUCCEEDED",
  RECOVERY_FAILED: "RECOVERY_FAILED",
  ROLLBACK_STARTED: "ROLLBACK_STARTED",
  ROLLBACK_SUCCEEDED: "ROLLBACK_SUCCEEDED",
  ROLLBACK_FAILED: "ROLLBACK_FAILED",
  SECURITY_ALERT: "SECURITY_ALERT",
  DECISION_REQUIRED: "DECISION_REQUIRED",
  DECISION_APPROVED: "DECISION_APPROVED",
  DECISION_REJECTED: "DECISION_REJECTED",
  DECISION_MODIFIED: "DECISION_MODIFIED",
  OPPORTUNITY_DETECTED: "OPPORTUNITY_DETECTED",
  CUSTOMER_CREATED: "CUSTOMER_CREATED",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  INVENTORY_LOW: "INVENTORY_LOW",
} as const;

export type BrainEventType = (typeof BRAIN_EVENT_TYPES)[keyof typeof BRAIN_EVENT_TYPES];

export type BrainEventSeverity = "debug" | "info" | "warning" | "error" | "critical";

export interface BrainEvent {
  eventId: string;
  eventType: BrainEventType;
  occurredAt: string;
  businessUnitId: BusinessUnitId;
  missionId?: string;
  taskId?: string;
  executionId?: string;
  agentId?: string;
  severity: BrainEventSeverity;
  source: string;
  correlationId: string;
  causationId?: string;
  payload: unknown;
  schemaVersion: 1;
}

export type BrainEventInput = Omit<BrainEvent, "eventId" | "schemaVersion"> & { eventId?: string };

export function createBrainEvent(input: BrainEventInput): BrainEvent {
  return Object.freeze({
    ...input,
    eventId: input.eventId ?? randomUUID(),
    schemaVersion: 1 as const,
  });
}

export function redactEventPayload(payload: unknown, sensitiveKeys: readonly string[]): unknown {
  const sensitive = new Set(sensitiveKeys.map((key) => key.toLowerCase()));

  const redact = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(redact);
    if (value === null || typeof value !== "object") return value;

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sensitive.has(key.toLowerCase()) ? "[REDACTED]" : redact(child);
    }
    return result;
  };

  return redact(payload);
}
