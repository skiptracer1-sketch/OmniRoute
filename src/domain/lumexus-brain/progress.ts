import type { BrainTask } from "./types.ts";

export interface MissionProgress {
  percentage: number | null;
  completed: number;
  total: number;
}

export function calculateMissionProgress(tasks: readonly BrainTask[]): MissionProgress {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "succeeded").length;
  if (total === 0) return { percentage: null, completed: 0, total: 0 };

  const allWeighted = tasks.every((task) => typeof task.weight === "number" && task.weight > 0);
  if (!allWeighted) return { percentage: null, completed, total };

  const totalWeight = tasks.reduce((sum, task) => sum + (task.weight ?? 0), 0);
  const completedWeight = tasks.reduce(
    (sum, task) => sum + (task.status === "succeeded" ? task.weight ?? 0 : 0),
    0,
  );

  return {
    percentage: totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 10000) / 100 : null,
    completed,
    total,
  };
}
