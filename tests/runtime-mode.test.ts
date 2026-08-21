import assert from "node:assert/strict";
import test from "node:test";
import { liveModeIsExplicitlyEnabled } from "../lib/runtime-mode";

test("live mode requires DEMO_MODE to be explicitly false", () => {
  assert.equal(liveModeIsExplicitlyEnabled({}), false);
  assert.equal(liveModeIsExplicitlyEnabled({ DEMO_MODE: "true" }), false);
  assert.equal(liveModeIsExplicitlyEnabled({ DEMO_MODE: "False" }), false);
  assert.equal(liveModeIsExplicitlyEnabled({ DEMO_MODE: "false" }), true);
});
