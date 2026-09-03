import type { DecisionOutcome, DecisionRequest } from "../../../domain/lumexus-brain/types.ts";
import type { DecisionStore } from "./stores.ts";

export interface ResolveDecisionInput {
  outcome: Extract<DecisionOutcome, "approved" | "rejected" | "modified">;
  decisionBy: string;
  decidedAt?: string;
  modification?: unknown;
}

export class DecisionQueue {
  constructor(private readonly store: DecisionStore) {}

  request(value: DecisionRequest): DecisionRequest {
    if (value.status !== "pending") throw new Error("new_decision_must_be_pending");
    if (this.store.get(value.id)) throw new Error(`decision_already_exists:${value.id}`);
    return this.store.put(value);
  }

  listPending(): DecisionRequest[] {
    return this.store.list().filter((value) => value.status === "pending");
  }

  resolve(id: string, input: ResolveDecisionInput): DecisionRequest {
    const current = this.store.get(id);
    if (!current) throw new Error(`decision_not_found:${id}`);
    if (current.status !== "pending") throw new Error(`decision_already_terminal:${id}`);

    const resolved: DecisionRequest = {
      ...current,
      status: input.outcome,
      decisionBy: input.decisionBy,
      decidedAt: input.decidedAt ?? new Date().toISOString(),
      decision: input.outcome === "modified" ? input.modification : input.outcome,
    };

    return this.store.put(resolved);
  }
}
