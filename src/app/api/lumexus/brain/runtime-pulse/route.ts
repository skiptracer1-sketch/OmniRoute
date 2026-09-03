import { NextResponse } from "next/server";
import { brainRuntime } from "@/server/services/lumexus-brain/runtime";
import { buildRuntimePulseProjection } from "@/server/services/lumexus-brain/runtimePulseProjection";
import { isAuthenticated } from "@/shared/utils/apiAuth";

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  return NextResponse.json(buildRuntimePulseProjection({
    missions: brainRuntime.missionStore.list(),
    tasks: brainRuntime.taskStore.list(),
    decisions: brainRuntime.decisionStore.list(),
    events: brainRuntime.eventStore.list(),
  }));
}
