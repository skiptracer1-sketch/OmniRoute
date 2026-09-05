import type { SecurityRole } from './types';

export interface SecurityAgentDefinition {
  role: SecurityRole;
  purpose: string;
  defaultActions: readonly string[];
  canRequestHighRisk: boolean;
}

export const SECURITY_AGENT_REGISTRY: Readonly<Record<SecurityRole, SecurityAgentDefinition>> = {
  recon: { role: 'recon', purpose: 'Passive discovery of authorized assets and metadata.', defaultActions: ['inspect'], canRequestHighRisk: false },
  'surface-analysis': { role: 'surface-analysis', purpose: 'Map authorized attack surface without destructive interaction.', defaultActions: ['inspect'], canRequestHighRisk: false },
  'vulnerability-classification': { role: 'vulnerability-classification', purpose: 'Classify evidence and prioritize suspected weaknesses.', defaultActions: ['inspect'], canRequestHighRisk: false },
  verification: { role: 'verification', purpose: 'Verify findings inside approved scope; elevated actions require approval.', defaultActions: ['inspect', 'verify'], canRequestHighRisk: true },
  'remediation-planning': { role: 'remediation-planning', purpose: 'Produce remediation plans; no autonomous production mutation.', defaultActions: ['inspect', 'plan'], canRequestHighRisk: false },
  regression: { role: 'regression', purpose: 'Re-test authorized fixes in isolated or approved environments.', defaultActions: ['inspect', 'verify'], canRequestHighRisk: true },
  reporting: { role: 'reporting', purpose: 'Aggregate evidence, decisions, and remediation status.', defaultActions: ['inspect', 'report'], canRequestHighRisk: false },
};
