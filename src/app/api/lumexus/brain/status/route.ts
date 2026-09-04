import { NextResponse } from "next/server";
import { brainRuntime } from "@/server/services/lumexus-brain/runtime";
import { isAuthenticated } from "@/shared/utils/apiAuth";

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  return NextResponse.json({
    schemaVersion: 1,
    persistence: "process-local-reference",
    missions: brainRuntime.missionStore.list().length,
    tasks: brainRuntime.taskStore.list().length,
    agents: brainRuntime.registry.list().length,
    pendingDecisions: brainRuntime.decisionQueue.listPending().length,
    events: brainRuntime.eventStore.list().length,
  });
}
