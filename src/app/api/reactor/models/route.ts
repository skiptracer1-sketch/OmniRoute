import { NextResponse } from "next/server";
import { listReactorModels } from "@/lib/reactor";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = listReactorModels().map((model) => ({
    id: model.id,
    provider: "reactor" as const,
    reactorModel: model.reactorModel,
    displayName: model.displayName,
    capability: model.capability,
    sdkPackage: model.sdkPackage,
    commands: model.commands,
    tracks: model.tracks,
    requiresInputMedia: model.requiresInputMedia,
  }));

  return NextResponse.json({ provider: "reactor", models });
}
