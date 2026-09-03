import test from "node:test";
import assert from "node:assert/strict";
import { AgentRegistry } from "../../../src/server/services/lumexus-brain/agentRegistry.ts";
import type { AgentDefinition, BrainTask } from "../../../src/domain/lumexus-brain/types.ts";

const agent: AgentDefinition = {
  id: "engineering-1",
  name: "Engineering Agent",
  category: "Engineering",
  businessScopes: ["lumexus-ai"],
  capabilities: ["code.write", "test.run"],
  allowedTools: ["github", "omniroute"],
  autonomyCeiling: 2,
  enabled: true,
  version: "1.0.0",
};

const baseTask: BrainTask = {
  id: "task-1",
  missionId: "mission-1",
  businessUnitId: "lumexus-ai",
  dependencies: [],
  requiredCapabilities: ["code.write"],
  requiredTools: ["github"],
  autonomyLevel: 2,
  status: "eligible",
  attemptCount: 0,
  maxAttempts: 3,
  evidenceRefs: [],
};

test("agent registry enforces business, capability, tool, and autonomy scope", () => {
  const registry = new AgentRegistry();
  registry.register(agent);

  assert.equal(registry.canExecute("engineering-1", baseTask).allowed, true);
  assert.equal(registry.canExecute("engineering-1", { ...baseTask, businessUnitId: "cypher-biopeptides" }).allowed, false);
  assert.equal(registry.canExecute("engineering-1", { ...baseTask, requiredCapabilities: ["security.admin"] }).allowed, false);
  assert.equal(registry.canExecute("engineering-1", { ...baseTask, requiredTools: ["production-shell"] }).allowed, false);
  assert.equal(registry.canExecute("engineering-1", { ...baseTask, autonomyLevel: 3 }).allowed, false);
});

test("disabled agents cannot execute", () => {
  const registry = new AgentRegistry();
  registry.register({ ...agent, id: "disabled", enabled: false });
  assert.equal(registry.canExecute("disabled", baseTask).allowed, false);
});
