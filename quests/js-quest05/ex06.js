"use strict";
// my_string_formatting(first, last, age) must print:
// "Hello, my name is FIRST LAST, I'm AGE.\n". 3 points, matching the 3 given
// examples.

const { runPrintFunctionTests, firstErrorLine, argsRepr } = require("./_common");

const FILE = "my_string_formatting.js";
const FUNC = "my_string_formatting";
const CASES = [
  { args: ["john", "doe", 37], expected: "Hello, my name is john doe, I'm 37.\n" },
  { args: ["Baby", "Yoda", 50], expected: "Hello, my name is Baby Yoda, I'm 50.\n" },
  { args: ["Marie", "Curie", 26], expected: "Hello, my name is Marie Curie, I'm 26.\n" },
];

exports.run = function (g) {
  const { missing, result, outcomes } = runPrintFunctionTests(g, FILE, FUNC, CASES);
  const label = (c) => `${FUNC}(${argsRepr(c.args)}) prints correctly`;

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
