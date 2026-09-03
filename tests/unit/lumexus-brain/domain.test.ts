import test from "node:test";
import assert from "node:assert/strict";

import {
  BUSINESS_UNITS,
  isBusinessUnitId,
} from "../../../src/domain/lumexus-brain/businessUnits.ts";

test("Lumexus Brain registers canonical business namespaces", () => {
  assert.deepEqual(BUSINESS_UNITS, [
    "lumexus-ai",
    "muscle-boulevard",
    "cypher-biopeptides",
    "real-peptide-news",
    "repolife",
    "omniroute",
    "jarvis",
  ]);

  assert.equal(isBusinessUnitId("repolife"), true);
  assert.equal(isBusinessUnitId("unknown-company"), false);
});
