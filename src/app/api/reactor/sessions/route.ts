import { NextResponse } from "next/server";
import { requireManagementAuth } from "@/lib/api/requireManagementAuth";
import {
  ReactorError,
  createReactorSession,
  getReactorModel,
  mintReactorToken,
  transitionReactorSession,
} from "@/lib/reactor";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof ReactorError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "REACTOR_CONNECTION_FAILED", message: "Unable to create Reactor session" }, { status: 500 });
}

export async function POST(request: Request) {
  const authError = await requireManagementAuth(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as {
      modelId?: string;
      tenantId?: string;
      userId?: string;
      correlationId?: string;
    };

    if (!body.modelId) {
      return NextResponse.json({ error: "REACTOR_MODEL_UNSUPPORTED", message: "modelId is required" }, { status: 400 });
    }

    const model = getReactorModel(body.modelId);
    if (!model) {
      throw new ReactorError("REACTOR_MODEL_UNSUPPORTED", `Unsupported Reactor model: ${body.modelId}`, 400);
    }

    const session = createReactorSession({
      modelId: body.modelId,
      tenantId: body.tenantId,
      userId: body.userId,
      correlationId: body.correlationId,
    });

    try {
      const minted = await mintReactorToken(body.modelId);
      const issued = transitionReactorSession(session.id, "token_issued");
      return NextResponse.json({
        sessionId: issued.id,
        provider: "reactor",
        modelId: model.id,
        reactorModel: minted.reactorModel,
        token: minted.token,
        expiresAt: minted.expiresAt,
        tracks: model.tracks,
        commands: model.commands,
        connection: {
          transport: "webrtc",
          sdkPackage: model.sdkPackage,
        },
      }, { status: 201 });
    } catch (error) {
      transitionReactorSession(session.id, "failed", {
        failureCode: error instanceof ReactorError ? error.code : "REACTOR_CONNECTION_FAILED",
      });
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
