import { NextResponse } from "next/server";
import { requireManagementAuth } from "@/lib/api/requireManagementAuth";
import {
  ReactorError,
  type ReactorSessionState,
  getReactorModel,
  getReactorSession,
  recordReactorEvent,
} from "@/lib/reactor";

export const dynamic = "force-dynamic";

const CLIENT_STATES = new Set<ReactorSessionState>([
  "connecting",
  "ready",
  "running",
  "paused",
  "completed",
  "stopped",
  "failed",
  "closed",
]);

function errorResponse(error: unknown) {
  if (error instanceof ReactorError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "REACTOR_COMMAND_REJECTED", message: "Unable to record Reactor event" }, { status: 500 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireManagementAuth(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const existing = getReactorSession(id);
    const model = getReactorModel(existing.modelId);
    if (!model) {
      throw new ReactorError("REACTOR_MODEL_UNSUPPORTED", "Reactor session model is unavailable", 409);
    }

    const body = (await request.json()) as {
      state?: ReactorSessionState;
      command?: string;
      failureCode?: string;
    };

    if (body.state && !CLIENT_STATES.has(body.state)) {
      throw new ReactorError("REACTOR_COMMAND_REJECTED", `Unsupported client state: ${body.state}`, 400);
    }
    if (body.command && !model.commands.includes(body.command)) {
      throw new ReactorError("REACTOR_COMMAND_REJECTED", `Unsupported command for ${model.id}: ${body.command}`, 400);
    }

    const session = recordReactorEvent(id, {
      state: body.state,
      command: body.command,
      failureCode: body.failureCode,
    });

    return NextResponse.json({ session });
  } catch (error) {
    return errorResponse(error);
  }
}
