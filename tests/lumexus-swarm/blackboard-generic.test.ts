import { expect, it } from 'vitest'; import { SwarmBlackboard } from '../../src/lumexus-swarm/blackboard';
it('supports typed blackboard values',()=>{const b=new SwarmBlackboard();b.put({missionId:'m',key:'count',value:3,sourceAgentId:'r'});expect(b.get<number>('m','count')[0]?.value).toBe(3);});
