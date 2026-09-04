import type { BrainTask, TaskStatus } from "./types.ts";

export interface TaskTransitionContext {
  verificationPassed?: boolean;
  decisionApproved?: boolean;
}

const LEGAL_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  queued: ["eligible", "cancelled"],
  eligible: ["planning", "awaiting_policy", "running", "cancelled"],
  planning: ["awaiting_policy", "awaiting_decision", "running", "failed", "cancelled"],
  awaiting_policy: ["eligible", "awaiting_decision", "running", "failed", "cancelled"],
  awaiting_decision: ["running", "cancelled", "failed"],
  running: ["testing", "verifying", "failed", "cancelled"],
  testing: ["verifying", "failed", "retry_scheduled", "cancelled"],
  verifying: ["succeeded", "failed", "retry_scheduled", "cancelled"],
  succeeded: [],
  failed: ["retry_scheduled", "recovering", "rolling_back", "isolated", "cancelled"],
  retry_scheduled: ["eligible", "running", "recovering", "cancelled"],
  recovering: ["testing", "verifying", "rolling_back", "isolated", "failed", "cancelled"],
  rolling_back: ["rolled_back", "isolated", "failed"],
  rolled_back: ["eligible", "isolated", "cancelled"],
  isolated: ["eligible", "cancelled"],
  cancelled: [],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

export function transitionTask(
  task: BrainTask,
  next: TaskStatus,
  context: TaskTransitionContext,
): BrainTask {
  if (!canTransitionTask(task.status, next)) {
    throw new Error(`Illegal task transition: ${task.status} -> ${next}`);
  }

  if (
    task.status === "awaiting_decision" &&
    next === "running" &&
    context.decisionApproved !== true
  ) {
    throw new Error("Task requires an approved decision before running");
  }

  if (
    task.status === "verifying" &&
    next === "succeeded" &&
    context.verificationPassed !== true
  ) {
    throw new Error("Task requires passed verification before succeeded");
  }

  return { ...task, status: next };
}
