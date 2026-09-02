import assert from "node:assert/strict";
import test from "node:test";
import { getReactorModel, listReactorModels } from "../../../../src/lib/reactor/models";

test("Reactor registry exposes the five native model families", () => {
  const ids = listReactorModels().map((model) => model.id).sort();
  assert.deepEqual(ids, ["helios", "longlive-v2", "ltx2", "sana-streaming", "x2"]);
});

test("LTX registry includes synchronized audio and video output tracks", () => {
  const model = getReactorModel("ltx2");
  assert.ok(model);
  assert.deepEqual(model.tracks, [
    { name: "main_video", kind: "video", direction: "out" },
    { name: "main_audio", kind: "audio", direction: "out" },
  ]);
  assert.ok(model.commands.includes("setAvatarImage"));
  assert.ok(model.commands.includes("setScript"));
});

test("X2 registry matches Reactor's current wire model and command surface", () => {
  const model = getReactorModel("x2");
  assert.ok(model);
  assert.equal(model.reactorModel, "xmax/x2");
  assert.ok(model.commands.includes("setPrompt"));
  assert.ok(model.commands.includes("setPointer"));
  assert.ok(model.commands.includes("setReferenceImage"));
  assert.equal(model.commands.includes("start"), false);
  assert.deepEqual(model.tracks, [
    { name: "source", kind: "video", direction: "in" },
    { name: "main_video", kind: "video", direction: "out" },
  ]);
});

test("unknown Reactor model ids are not resolved", () => {
  assert.equal(getReactorModel("arbitrary-upstream-model"), undefined);
});
