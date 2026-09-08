"use strict";
// `if (XX)` must correctly compare nbr to 20. 2 points.
//
// A script that just prints the "expected" string regardless of the actual
// comparison would pass a check that only runs the given nbr = 10. So we
// re-run the same script with nbr swapped to 25 and expect the other branch.

const { extractScripts, runScripts, overrideAssignment } = require("../../lib/html");

const FILE = "index.html";
const LESS = "nbr is less than 20";
const GREATER = "nbr is greater than 20";

function runWithNbr(source, value) {
  const patched = value === null ? source : overrideAssignment(source, "nbr", value);
  if (patched === null) return { overrideFailed: true };
  return { ...runScripts([patched]) };
}

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    g.check(`prints "${LESS}" when nbr = 10`, false, "nothing to inspect");
    g.check(`prints "${GREATER}" when nbr = 25`, false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const source = extractScripts(html).join("\n");
  if (!source.trim()) {
    g.check(`prints "${LESS}" when nbr = 10`, false, "no inline <script> tag found");
    g.check(`prints "${GREATER}" when nbr = 25`, false, "no inline <script> tag found");
    return;
  }

  const cases = [
    { label: `prints "${LESS}" when nbr = 10`, value: null, expect: LESS },
    { label: `prints "${GREATER}" when nbr = 25`, value: "25", expect: GREATER },
  ];

  for (const c of cases) {
    const result = runWithNbr(source, c.value);
    if (result.overrideFailed) {
      g.check(c.label, false, "could not find 'nbr = 10;' to substitute a different value for this test");
      continue;
    }
    if (result.error) {
      g.check(c.label, false, `script threw: ${result.error.message}`);
      continue;
    }
    const ok = result.logs.includes(c.expect);
    g.check(
      c.label,
      ok,
      ok ? "" : result.logs.length ? `printed: ${result.logs.join(" | ")}` : "console.log was never called"
    );
  }
};
