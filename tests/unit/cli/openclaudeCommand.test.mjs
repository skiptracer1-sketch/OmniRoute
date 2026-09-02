import { test } from "node:test";
import assert from "node:assert/strict";
import { Command } from "commander";

import { registerOpenClaude } from "../../../bin/cli/commands/openclaude.mjs";

test("registerOpenClaude adds an openclaude command with passthrough args", () => {
  const program = new Command();
  registerOpenClaude(program);

  const command = program.commands.find((candidate) => candidate.name() === "openclaude");
  assert.ok(command, "openclaude command should be registered");
  assert.equal(command._allowUnknownOption, true);
  assert.equal(command._allowExcessArguments, true);
});

test("openclaude command forwards model/base-url options into bridge environment", async () => {
  let observed;
  const program = new Command();
  registerOpenClaude(program, {
    run: async (opts, args) => {
      observed = { opts, args };
      return 0;
    },
  });

  await program.parseAsync([
    "node",
    "omniroute",
    "openclaude",
    "--model",
    "auto",
    "--base-url",
    "http://localhost:20128/v1",
    "--",
    "--continue",
  ]);

  assert.deepEqual(observed.args, ["--continue"]);
  assert.equal(observed.opts.model, "auto");
  assert.equal(observed.opts.baseUrl, "http://localhost:20128/v1");
});
