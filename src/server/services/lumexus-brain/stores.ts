import type {
  AgentDefinition,
  BrainTask,
  DecisionRequest,
  Execution,
  Mission,
  VerificationResult,
} from "../../../domain/lumexus-brain/types.ts";
import type { BrainEvent } from "../../../domain/lumexus-brain/events.ts";

export interface MissionStore { get(id: string): Mission | undefined; put(value: Mission): Mission; list(): Mission[]; }
export interface TaskStore { get(id: string): BrainTask | undefined; put(value: BrainTask): BrainTask; list(): BrainTask[]; }
export interface AgentRegistryStore { get(id: string): AgentDefinition | undefined; put(value: AgentDefinition): AgentDefinition; list(): AgentDefinition[]; }
export interface EventStore { append(value: BrainEvent): BrainEvent; list(): BrainEvent[]; }
export interface DecisionStore { get(id: string): DecisionRequest | undefined; put(value: DecisionRequest): DecisionRequest; list(): DecisionRequest[]; }
export interface ExecutionStore { get(id: string): Execution | undefined; put(value: Execution): Execution; list(): Execution[]; }
export interface VerificationStore { get(id: string): VerificationResult | undefined; put(value: VerificationResult): VerificationResult; list(): VerificationResult[]; }

class InMemoryEntityStore<T extends { id: string }> {
  private readonly values = new Map<string, T>();
  get(id: string): T | undefined { const value = this.values.get(id); return value ? structuredClone(value) : undefined; }
  put(value: T): T { const copy = structuredClone(value); this.values.set(copy.id, copy); return structuredClone(copy); }
  list(): T[] { return [...this.values.values()].map((value) => structuredClone(value)); }
}

export class InMemoryMissionStore extends InMemoryEntityStore<Mission> implements MissionStore {}
export class InMemoryTaskStore extends InMemoryEntityStore<BrainTask> implements TaskStore {}
export class InMemoryAgentRegistryStore extends InMemoryEntityStore<AgentDefinition> implements AgentRegistryStore {}
export class InMemoryDecisionStore extends InMemoryEntityStore<DecisionRequest> implements DecisionStore {}
export class InMemoryExecutionStore extends InMemoryEntityStore<Execution> implements ExecutionStore {}
export class InMemoryVerificationStore extends InMemoryEntityStore<VerificationResult> implements VerificationStore {}

export class InMemoryEventStore implements EventStore {
  private readonly events: BrainEvent[] = [];
  append(value: BrainEvent): BrainEvent { const copy = structuredClone(value); this.events.push(copy); return structuredClone(copy); }
  list(): BrainEvent[] { return this.events.map((event) => structuredClone(event)); }
}
