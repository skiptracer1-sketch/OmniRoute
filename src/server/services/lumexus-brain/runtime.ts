import { AgentRegistry } from "./agentRegistry.ts";
import { BrainService } from "./brainService.ts";
import { DecisionQueue } from "./decisionQueue.ts";
import {
  InMemoryDecisionStore,
  InMemoryEventStore,
  InMemoryMissionStore,
  InMemoryTaskStore,
  InMemoryVerificationStore,
} from "./stores.ts";

const missionStore = new InMemoryMissionStore();
const taskStore = new InMemoryTaskStore();
const eventStore = new InMemoryEventStore();
const verificationStore = new InMemoryVerificationStore();
const decisionStore = new InMemoryDecisionStore();
const registry = new AgentRegistry();
const decisionQueue = new DecisionQueue(decisionStore);
const brainService = new BrainService({
  missionStore,
  taskStore,
  eventStore,
  verificationStore,
  registry,
  decisionQueue,
});

export const brainRuntime = {
  missionStore,
  taskStore,
  eventStore,
  verificationStore,
  decisionStore,
  registry,
  decisionQueue,
  brainService,
} as const;
