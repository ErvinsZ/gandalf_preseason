"use strict";
// my_average_mark(marks): average of each object's "integer" field, rounded
// to 1 decimal place (0.0 for an empty array). 3 points, matching the 3
// given examples.
//
// Uses a tolerance-based comparison rather than strict equality: a correct
// implementation might land on 8.299999999999999 due to floating-point
// division before rounding, which should still count as 8.3.

const { runFunctionTests, firstErrorLine, argsRepr } = require("./_common");

const FILE = "my_average_mark.js";
const FUNC = "my_average_mark";
const CASES = [
  {
    args: [[
      { string: "John", integer: 7 },
      { string: "Margot", integer: 8 },
      { string: "Jules", integer: 4 },
      { string: "Marco", integer: 19 },
    ]],
    expect: 9.5,
  },
  {
    args: [[
      { string: "Quentin", integer: 1 },
      { string: "Fred", integer: 1 },
      { string: "Julia", integer: 18 },
      { string: "stephanie", integer: 13 },
    ]],
    expect: 8.3,
  },
  // The docs show 0.0 for an empty array, but a real submission that leaves
  // this uncovered (0/0 -> NaN) still passes on Qwasar -- so their actual
  // check just confirms this doesn't crash and returns a number, not the
  // specific value. We match that rather than the stricter doc reading.
  { args: [[]], anyNumber: true },
];

function closeTo(value, expected, epsilon = 1e-6) {
  return typeof value === "number" && Math.abs(value - expected) < epsilon;
}

exports.run = function (g) {
  const { missing, result, outcomes } = runFunctionTests(g, FILE, FUNC, CASES);
  const label = (c) => (c.anyNumber ? `${FUNC}(${argsRepr(c.args)}) doesn't crash` : `${FUNC}(${argsRepr(c.args)}) === ${c.expect}`);

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
    } else if (o.parseError) {
      g.check(label(c), false, `unexpected output: ${o.raw}`);
    } else {
      const ok = c.anyNumber ? typeof o.value === "number" : closeTo(o.value, c.expect);
      g.check(label(c), ok, ok ? "" : `got ${JSON.stringify(o.value)} (a ${typeof o.value})`);
    }
  });
};
