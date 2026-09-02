export type ReactorCapability =
  | "avatar"
  | "video-transform"
  | "video-generate"
  | "multi-shot-video"
  | "video-edit";

export type ReactorTrack = {
  name: string;
  kind: "audio" | "video";
  direction: "in" | "out";
};

export type ReactorModelDefinition = {
  id: string;
  reactorModel: string;
  displayName: string;
  capability: ReactorCapability;
  sdkPackage: string;
  commands: readonly string[];
  tracks: readonly ReactorTrack[];
  requiresInputMedia: boolean;
};

export const REACTOR_MODELS = {
  ltx2: {
    id: "ltx2",
    reactorModel: "reactor/ltx2",
    displayName: "LTX Real-Time Avatars",
    capability: "avatar",
    sdkPackage: "@reactor-models/ltx2",
    commands: ["start", "stop", "pause", "resume", "reset", "setScript", "setAvatarImage", "setPrompt", "setWpm", "setSeed", "setDurationSeconds"],
    tracks: [
      { name: "main_video", kind: "video", direction: "out" },
      { name: "main_audio", kind: "audio", direction: "out" },
    ],
    requiresInputMedia: false,
  },
  x2: {
    id: "x2",
    reactorModel: "reactor/x2",
    displayName: "X2 Real-Time Video Transform",
    capability: "video-transform",
    sdkPackage: "@reactor-models/x2",
    commands: ["start", "stop", "pause", "resume", "reset", "setPrompt"],
    tracks: [
      { name: "source", kind: "video", direction: "in" },
      { name: "main_video", kind: "video", direction: "out" },
    ],
    requiresInputMedia: true,
  },
  helios: {
    id: "helios",
    reactorModel: "reactor/helios",
    displayName: "Helios Real-Time Video",
    capability: "video-generate",
    sdkPackage: "@reactor-models/helios",
    commands: ["start", "stop", "pause", "resume", "reset", "setPrompt"],
    tracks: [{ name: "main_video", kind: "video", direction: "out" }],
    requiresInputMedia: false,
  },
  "longlive-v2": {
    id: "longlive-v2",
    reactorModel: "reactor/longlive-v2",
    displayName: "LongLive 2",
    capability: "multi-shot-video",
    sdkPackage: "@reactor-models/longlive-v2",
    commands: ["start", "pause", "resume", "reset", "setSeed", "setShot", "sceneCut", "scheduleShot", "scheduleSceneCut"],
    tracks: [{ name: "main_video", kind: "video", direction: "out" }],
    requiresInputMedia: false,
  },
  "sana-streaming": {
    id: "sana-streaming",
    reactorModel: "reactor/sana-streaming",
    displayName: "SANA-Streaming",
    capability: "video-edit",
    sdkPackage: "@reactor-models/sana-streaming",
    commands: ["start", "stop", "pause", "resume", "reset", "setPrompt"],
    tracks: [
      { name: "camera", kind: "video", direction: "in" },
      { name: "main_video", kind: "video", direction: "out" },
    ],
    requiresInputMedia: true,
  },
} as const satisfies Record<string, ReactorModelDefinition>;

export type ReactorModelId = keyof typeof REACTOR_MODELS;

export function getReactorModel(modelId: string): ReactorModelDefinition | undefined {
  return (REACTOR_MODELS as Record<string, ReactorModelDefinition>)[modelId];
}

export function listReactorModels(): ReactorModelDefinition[] {
  return Object.values(REACTOR_MODELS);
}
