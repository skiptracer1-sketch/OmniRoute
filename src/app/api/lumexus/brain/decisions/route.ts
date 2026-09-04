import { NextResponse } from "next/server";
import { brainRuntime } from "@/server/services/lumexus-brain/runtime";
import { isAuthenticated } from "@/shared/utils/apiAuth";

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  return NextResponse.json({
    schemaVersion: 1,
    decisions: brainRuntime.decisionQueue.listPending(),
  });
}
