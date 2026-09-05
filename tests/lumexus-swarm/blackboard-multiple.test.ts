import { expect, it } from 'vitest'; import { SwarmBlackboard } from '../../src/lumexus-swarm/blackboard';
it('retains multiple observations under a mission key',()=>{const b=new SwarmBlackboard();b.put({missionId:'m',key:'surface',value:'a',sourceAgentId:'r'});b.put({missionId:'m',key:'surface',value:'b',sourceAgentId:'s'});expect(b.get('m','surface').map(x=>x.value)).toEqual(['a','b']);});
