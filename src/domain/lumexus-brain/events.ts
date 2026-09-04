import { randomUUID } from "node:crypto";
import type { BusinessUnitId } from "./types.ts";

export type BrainEventType =
  | "MISSION_CREATED"
  | "MISSION_UPDATED"
  | "MISSION_COMPLETED"
  | "TASK_CREATED"
  | "TASK_READY"
  | "TASK_STARTED"
  | "TASK_COMPLETED"
  | "TASK_FAILED"
  | "AGENT_STARTED"
  | "AGENT_COMPLETED"
  | "AGENT_FAILED"
  | "MODEL_ROUTE_SELECTED"
  | "MODEL_FALLBACK"
  | "TOOL_CALL_STARTED"
  | "TOOL_CALL_COMPLETED"
  | "TOOL_CALL_FAILED"
  | "TEST_STARTED"
  | "TEST_PASSED"
  | "TEST_FAILED"
  | "VERIFICATION_PASSED"
  | "VERIFICATION_FAILED"
  | "DEPLOY_STARTED"
  | "DEPLOY_SUCCEEDED"
  | "DEPLOY_FAILED"
  | "SERVICE_DEGRADED"
  | "SERVICE_FAILED"
  | "RECOVERY_STARTED"
  | "RECOVERY_SUCCEEDED"
  | "RECOVERY_FAILED"
  | "ROLLBACK_STARTED"
  | "ROLLBACK_SUCCEEDED"
  | "ROLLBACK_FAILED"
  | "SECURITY_ALERT"
  | "DECISION_REQUIRED"
  | "DECISION_APPROVED"
  | "DECISION_REJECTED"
  | "DECISION_MODIFIED"
  | "OPPORTUNITY_DETECTED"
  | "CUSTOMER_CREATED"
  | "PAYMENT_RECEIVED"
  | "INVENTORY_LOW";

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
