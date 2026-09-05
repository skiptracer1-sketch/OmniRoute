# Lumexus Native Swarm v0.1

Import the stable module from `src/lumexus-swarm/module`.

The v0.1 vertical slice provides mission creation, seven security roles, mission-scoped blackboard, typed event fabric, OmniRoute routing adapter, supervisor planning, scope/risk policy enforcement, approval bridge, Runtime Pulse projection, evidence findings, and an emergency kill switch.

Tool execution is fail-closed: the executor is not called for out-of-scope requests or high/critical requests awaiting approval.

No autonomous exploitation or production mutation capability is provided by the default registry.
