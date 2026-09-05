export interface BlackboardEntry<T = unknown> {
  missionId: string;
  key: string;
  value: T;
  sourceAgentId: string;
  recordedAt: string;
}

export class SwarmBlackboard {
  private readonly entries: BlackboardEntry[] = [];
  put<T>(entry: Omit<BlackboardEntry<T>, 'recordedAt'>): BlackboardEntry<T> {
    const stored = { ...entry, recordedAt: new Date().toISOString() };
    this.entries.push(stored);
    return stored;
  }
  get<T = unknown>(missionId: string, key: string): BlackboardEntry<T>[] {
    return this.entries.filter(e => e.missionId === missionId && e.key === key) as BlackboardEntry<T>[];
  }
}
