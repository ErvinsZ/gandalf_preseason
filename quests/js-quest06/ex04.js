"use strict";
// my_each(arr): prints each element of arr on its own line, returns nothing.
// 3 points, matching the 3 given examples.

const { runPrintFunctionTests, firstErrorLine, argsRepr } = require("./_common");

const FILE = "my_each.js";
const FUNC = "my_each";
const CASES = [
  { args: [["blah1", "blah2", "blah3"]], expected: "blah1\nblah2\nblah3\n" },
  { args: [["blah1", "blah2"]], expected: "blah1\nblah2\n" },
  { args: [["1arg"]], expected: "1arg\n" },
];

exports.run = function (g) {
  const { missing, result, outcomes } = runPrintFunctionTests(g, FILE, FUNC, CASES);
  const label = (c) => `${FUNC}(${argsRepr(c.args)}) prints each element`;

  if (missing) {
    for (const c of CASES) g.check(label(c), false, g.exists(FILE) ? "" : "no such file in this directory");
    return;
  }
  if (result.timedOut) {
    for (const c of CASES) g.check(label(c), false, "the script didn't finish in time");
    return;
  }
  if (result.code !== 0 && outcomes.every((o) => !o.found)) {
    const detail = `node exited with ${result.code}: ${firstErrorLine(result.stderr)}`;
    for (const c of CASES) g.check(label(c), false, detail);
    return;
  }

  CASES.forEach((c, i) => {
    const o = outcomes[i];
    if (!o.found) {
      g.check(label(c), false, "no output for this case (a call before it likely crashed the script)");
    } else if (o.threw) {
      g.check(label(c), false, `threw: ${o.message}`);
    } else {
      const ok = o.printed === c.expected || o.printed.replace(/\n$/, "") === c.expected.replace(/\n$/, "");
      g.check(label(c), ok, ok ? "" : `printed ${JSON.stringify(o.printed)}`);
    }
  });
};
