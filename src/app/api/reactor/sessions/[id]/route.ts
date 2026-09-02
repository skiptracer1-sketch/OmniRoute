import { NextResponse } from "next/server";
import { requireManagementAuth } from "@/lib/api/requireManagementAuth";
import { ReactorError, closeReactorSession, getReactorSession } from "@/lib/reactor";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof ReactorError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "REACTOR_INVALID_SESSION", message: "Unable to access Reactor session" }, { status: 500 });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireManagementAuth(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    return NextResponse.json({ session: getReactorSession(id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireManagementAuth(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    return NextResponse.json({ session: closeReactorSession(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
