import test from 'node:test';
import assert from 'node:assert/strict';

const { buildOpenClaudeEnv } = await import('../../../scripts/integrations/openclaude-bridge.mjs');

test('buildOpenClaudeEnv points OpenClaude at OmniRoute by default', () => {
  const env = buildOpenClaudeEnv({});
  assert.equal(env.CLAUDE_CODE_USE_OPENAI, '1');
  assert.equal(env.OPENAI_BASE_URL, 'http://localhost:20128/v1');
  assert.equal(env.OPENAI_MODEL, 'auto');
  assert.equal(env.OPENAI_API_KEY, 'omniroute-local');
});

test('buildOpenClaudeEnv respects explicit OpenAI overrides', () => {
  const env = buildOpenClaudeEnv({
    OPENAI_BASE_URL: 'http://127.0.0.1:9999/v1',
    OPENAI_MODEL: 'openai/gpt-5',
    OPENAI_API_KEY: 'secret',
  });
  assert.equal(env.OPENAI_BASE_URL, 'http://127.0.0.1:9999/v1');
  assert.equal(env.OPENAI_MODEL, 'openai/gpt-5');
  assert.equal(env.OPENAI_API_KEY, 'secret');
});
