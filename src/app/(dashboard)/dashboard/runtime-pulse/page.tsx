import RuntimePulse from "../RuntimePulse";

export const metadata = {
  title: "Runtime Pulse | OmniRoute",
  description: "Live OmniRoute gateway readiness and OpenClaude bridge status.",
};

export default function RuntimePulsePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Runtime Pulse</h1>
        <p className="mt-1 text-sm text-text-muted">
          Live readiness telemetry for the OmniRoute gateway and OpenClaude bridge.
        </p>
      </div>
      <RuntimePulse />
    </div>
  );
}
