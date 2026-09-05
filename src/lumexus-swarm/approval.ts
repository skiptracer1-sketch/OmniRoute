import type { ApprovalRequest } from './types';

export interface DecisionQueueAdapter {
  submit(request: ApprovalRequest): Promise<{ decisionId: string }>;
}

export class SwarmApprovalBridge {
  constructor(private readonly queue: DecisionQueueAdapter) {}
  submit(request: ApprovalRequest) { return this.queue.submit(request); }
}
