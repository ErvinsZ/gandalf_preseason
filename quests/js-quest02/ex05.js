"use strict";
// Two if-statements over six fixed variables (a,b,c,d,y,z). 9 points.
//
// Note: this is an approximation of Qwasar's own (undisclosed) test matrix,
// which reportedly runs 13 checks here -- without knowing their exact cases
// there's no way to match that count precisely. This battery re-runs the
// script with several of the variables swapped, to catch a condition that
// happens to print the right thing for the example values but uses the
// wrong comparison or operator.

const { extractScripts, runScripts, overrideMany } = require("../../lib/html");

const FILE = "index.html";
const MSG1 = "a is bigger than b AND smaller than c AND equal to d";
const MSG2 = "z OR y are bigger than a";

function runWith(source, overrides) {
  const patched = overrides ? overrideMany(source, overrides) : source;
  if (patched === null) return { overrideFailed: true };
  return { ...runScripts([patched]) };
}

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");

  const scenarios = [
    { label: "baseline (a=10,b=9,c=11,d=10): condition 1 prints", overrides: null, msg: MSG1, expect: true },
    { label: "baseline (y=9,z=11,a=10): condition 2 prints", overrides: null, msg: MSG2, expect: true },
    { label: "a <= b (a=8): condition 1 stays silent", overrides: { a: 8 }, msg: MSG1, expect: false },
    { label: "a >= c (a=12): condition 1 stays silent", overrides: { a: 12 }, msg: MSG1, expect: false },
    { label: "a !== d (d=5): condition 1 stays silent", overrides: { d: 5 }, msg: MSG1, expect: false },
    { label: "y and z both <= a (y=5,z=5): condition 2 stays silent", overrides: { y: 5, z: 5 }, msg: MSG2, expect: false },
    { label: "only y > a (y=15,z=5): condition 2 prints", overrides: { y: 15, z: 5 }, msg: MSG2, expect: true },
    { label: "only z > a (y=5,z=15): condition 2 prints", overrides: { y: 5, z: 15 }, msg: MSG2, expect: true },
  ];

  if (!exists) {
    for (const s of scenarios) g.check(s.label, false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const source = extractScripts(html).join("\n");
  if (!source.trim()) {
    for (const s of scenarios) g.check(s.label, false, "no inline <script> tag found");
    return;
  }

  for (const s of scenarios) {
    const result = runWith(source, s.overrides);
    if (result.overrideFailed) {
      g.check(s.label, false, "could not substitute variables to test this case (unexpected script format)");
      continue;
    }
    if (result.error) {
      g.check(s.label, false, `script threw: ${result.error.message}`);
      continue;
    }
    const got = result.logs.includes(s.msg);
    g.check(
      s.label,
      got === s.expect,
      got === s.expect
        ? ""
        : s.expect
        ? "expected message was not printed"
        : `message was printed even though it shouldn't be (logs: ${result.logs.join(" | ")})`
    );
  }
};
