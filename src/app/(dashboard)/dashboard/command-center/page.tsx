import CommandCenterClient from "./CommandCenterClient";
import LiveReadinessMeter from "./LiveReadinessMeter";

// Native OmniRoute route for the Lumexus Command Center.
export default function CommandCenterPage() {
  return (
    <div className="space-y-6">
      <LiveReadinessMeter />
      <CommandCenterClient />
    </div>
  );
}
