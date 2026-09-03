import { NextResponse } from "next/server";
import { brainRuntime } from "@/server/services/lumexus-brain/runtime";
import { isAuthenticated } from "@/shared/utils/apiAuth";

const ALLOWED_OUTCOMES = new Set(["approved", "rejected", "modified"]);

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid decision payload" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  if (typeof payload.outcome !== "string" || !ALLOWED_OUTCOMES.has(payload.outcome)) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }
  if (typeof payload.decisionBy !== "string" || payload.decisionBy.trim().length === 0) {
    return NextResponse.json({ error: "decisionBy is required" }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const decision = brainRuntime.decisionQueue.resolve(id, {
      outcome: payload.outcome as "approved" | "rejected" | "modified",
      decisionBy: payload.decisionBy,
      modification: payload.modification,
    });
    return NextResponse.json({ schemaVersion: 1, decision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decision resolution failed";
    const status = message.startsWith("decision_not_found:") ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
