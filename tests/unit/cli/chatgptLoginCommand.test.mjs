import test from "node:test";
import assert from "node:assert/strict";
import { Command } from "commander";
import * as loginModule from "../../../bin/cli/commands/login.mjs";

test("runChatgptLogin delegates ChatGPT account linking to Codex OAuth", async () => {
  assert.equal(typeof loginModule.runChatgptLogin, "function");

  let received;
  await loginModule.runChatgptLogin(
    { browser: false, timeout: 123456 },
    {
      startOAuth: async (opts) => {
        received = opts;
      },
    }
  );

  assert.deepEqual(received, {
    provider: "codex",
    browser: false,
    timeout: 123456,
  });
});

test("omniroute login registers chatgpt as a first-class subcommand", () => {
  const program = new Command();
  loginModule.registerLogin(program);

  const login = program.commands.find((command) => command.name() === "login");
  assert.ok(login, "login command should exist");

  const chatgpt = login.commands.find((command) => command.name() === "chatgpt");
  assert.ok(chatgpt, "chatgpt login subcommand should exist");
  assert.match(chatgpt.description(), /ChatGPT|OpenAI/i);
});
