export type RecoveryAction = "retry" | "recover" | "rollback" | "isolate" | "escalate";

export interface RecoveryInput {
  attemptCount: number;
  maxAttempts: number;
  safeRepairAvailable: boolean;
  safeRepairFailed: boolean;
  rollbackAvailable: boolean;
  rollbackFailed: boolean;
  isolated: boolean;
}

export function calculateBackoffMs(attempt: number, baseMs: number, maxMs: number): number {
  const safeAttempt = Math.max(0, Math.floor(attempt));
  return Math.min(maxMs, baseMs * 2 ** safeAttempt);
}

export function nextRecoveryAction(input: RecoveryInput): RecoveryAction {
  if (input.attemptCount < input.maxAttempts) return "retry";
  if (input.safeRepairAvailable && !input.safeRepairFailed) return "recover";
  if (input.rollbackAvailable && !input.rollbackFailed) return "rollback";
  if (!input.isolated) return "isolate";
  return "escalate";
}
