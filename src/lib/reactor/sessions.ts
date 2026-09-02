import { randomUUID } from "node:crypto";
import { ReactorError } from "./errors";
import { getReactorModel } from "./models";

export type ReactorSessionState =
  | "created"
  | "token_issued"
  | "connecting"
  | "ready"
  | "running"
  | "paused"
  | "completed"
  | "stopped"
  | "failed"
  | "closed";

export type ReactorSessionRecord = {
  id: string;
  modelId: string;
  reactorModel: string;
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  state: ReactorSessionState;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  commandCount: number;
  failureCode?: string;
};

const sessions = new Map<string, ReactorSessionRecord>();

const allowedTransitions: Record<ReactorSessionState, readonly ReactorSessionState[]> = {
  created: ["token_issued", "failed", "closed"],
  token_issued: ["connecting", "failed", "closed"],
  connecting: ["ready", "failed", "closed"],
  ready: ["running", "failed", "closed"],
  running: ["paused", "completed", "stopped", "failed", "closed"],
  paused: ["running", "stopped", "failed", "closed"],
  completed: ["closed"],
  stopped: ["closed"],
  failed: ["closed"],
  closed: [],
};

export function createReactorSession(input: {
  modelId: string;
  tenantId?: string;
  userId?: string;
  correlationId?: string;
}): ReactorSessionRecord {
  const model = getReactorModel(input.modelId);
  if (!model) {
    throw new ReactorError("REACTOR_MODEL_UNSUPPORTED", `Unsupported Reactor model: ${input.modelId}`, 400);
  }

  const now = new Date().toISOString();
  const record: ReactorSessionRecord = {
    id: randomUUID(),
    modelId: model.id,
    reactorModel: model.reactorModel,
    tenantId: input.tenantId,
    userId: input.userId,
    correlationId: input.correlationId,
    state: "created",
    createdAt: now,
    updatedAt: now,
    commandCount: 0,
  };
  sessions.set(record.id, record);
  return { ...record };
}

export function getReactorSession(id: string): ReactorSessionRecord {
  const record = sessions.get(id);
  if (!record) {
    throw new ReactorError("REACTOR_INVALID_SESSION", "Reactor session not found", 404);
  }
  return { ...record };
}

export function transitionReactorSession(
  id: string,
  nextState: ReactorSessionState,
  meta: { failureCode?: string } = {}
): ReactorSessionRecord {
  const record = sessions.get(id);
  if (!record) {
    throw new ReactorError("REACTOR_INVALID_SESSION", "Reactor session not found", 404);
  }
  if (!allowedTransitions[record.state].includes(nextState)) {
    throw new ReactorError(
      "REACTOR_COMMAND_REJECTED",
      `Invalid Reactor session transition: ${record.state} -> ${nextState}`,
      409
    );
  }

  const now = new Date().toISOString();
  record.state = nextState;
  record.updatedAt = now;
  if (nextState === "running" && !record.startedAt) record.startedAt = now;
  if (["completed", "stopped", "failed", "closed"].includes(nextState)) record.endedAt = now;
  if (meta.failureCode) record.failureCode = meta.failureCode;
  return { ...record };
}

export function recordReactorEvent(
  id: string,
  event: { state?: ReactorSessionState; command?: string; failureCode?: string }
): ReactorSessionRecord {
  const record = sessions.get(id);
  if (!record) {
    throw new ReactorError("REACTOR_INVALID_SESSION", "Reactor session not found", 404);
  }
  if (event.command) record.commandCount += 1;
  if (event.state) return transitionReactorSession(id, event.state, { failureCode: event.failureCode });
  record.updatedAt = new Date().toISOString();
  if (event.failureCode) record.failureCode = event.failureCode;
  return { ...record };
}

export function closeReactorSession(id: string): ReactorSessionRecord {
  const record = sessions.get(id);
  if (!record) {
    throw new ReactorError("REACTOR_INVALID_SESSION", "Reactor session not found", 404);
  }
  if (record.state === "closed") return { ...record };
  return transitionReactorSession(id, "closed");
}
