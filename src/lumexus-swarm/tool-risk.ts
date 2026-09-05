import type { RiskLevel } from './types';

const ORDER: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };
export function requiresDecisionQueue(risk: RiskLevel): boolean { return ORDER[risk] >= ORDER.high; }
