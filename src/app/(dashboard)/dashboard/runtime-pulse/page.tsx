import RuntimePulse from "../RuntimePulse";

export const metadata = {
  title: "Runtime Pulse | OmniRoute",
  description: "Live OmniRoute gateway health and routing-path telemetry.",
};

export default function RuntimePulsePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Runtime Pulse</h1>
        <p className="mt-1 text-sm text-text-muted">
          Measured gateway health and latency. Agent and OpenClaude process progress will be driven by persisted runtime events.
        </p>
      </div>
      <RuntimePulse />
    </div>
  );
}
