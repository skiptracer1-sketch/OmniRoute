import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BASE_URL = 'http://localhost:20128/v1';
const DEFAULT_MODEL = 'auto';
const DEFAULT_API_KEY = 'omniroute-local';

export function buildOpenClaudeEnv(source = process.env) {
  return {
    ...source,
    CLAUDE_CODE_USE_OPENAI: '1',
    OPENAI_BASE_URL: source.OMNIROUTE_OPENCLAUDE_BASE_URL || DEFAULT_BASE_URL,
    OPENAI_MODEL: source.OMNIROUTE_OPENCLAUDE_MODEL || DEFAULT_MODEL,
    OPENAI_API_KEY: source.OMNIROUTE_OPENCLAUDE_API_KEY || DEFAULT_API_KEY,
  };
}

export function resolveOpenClaudePaths(repoRoot) {
  const root = resolve(repoRoot, 'integrations', 'openclaude');
  return {
    root,
    bin: resolve(root, 'bin', 'openclaude'),
    dist: resolve(root, 'dist', 'cli.mjs'),
  };
}

export function ensureOpenClaudeBuilt(paths, env = process.env) {
  if (existsSync(paths.dist)) return;
  const result = spawnSync('bun', ['run', 'build'], {
    cwd: paths.root,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) {
    throw new Error(`Unable to build OpenClaude with Bun: ${result.error.message}`);
  }
  if (result.status !== 0 || !existsSync(paths.dist)) {
    throw new Error('OpenClaude build failed. Install Bun, then run `bun run build` inside integrations/openclaude.');
  }
}

export function launchOpenClaude(args = process.argv.slice(2), options = {}) {
  const repoRoot = options.repoRoot || resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const paths = resolveOpenClaudePaths(repoRoot);
  if (!existsSync(paths.bin)) {
    throw new Error('OpenClaude submodule is missing. Run: git submodule update --init --recursive');
  }

  const env = buildOpenClaudeEnv(options.env || process.env);
  ensureOpenClaudeBuilt(paths, env);

  return spawn(process.execPath, [paths.bin, ...args], {
    cwd: options.cwd || process.cwd(),
    env,
    stdio: 'inherit',
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const child = launchOpenClaude();
    child.once('exit', code => process.exit(code ?? 1));
    child.once('error', error => {
      console.error(`OpenClaude launch failed: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`OpenClaude launch failed: ${error.message}`);
    process.exit(1);
  }
}
