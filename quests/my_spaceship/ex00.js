"use strict";
// my_spaceship(path): simulates turns (R/L) and advances (A) from (0,0)
// facing 'up', returns a STRING like "{x: 2, y: -1, direction: 'down'}".
// 4 points, matching the 4 given examples.
//
// The real gandalf's "Expected Return Value" column shows this unquoted, as
// a plain object -- while "Return Value" shows a quoted string, since the
// function genuinely returns a string. That asymmetry is the signal that
// the real grader parses the returned string's fields (x, y, direction)
// rather than doing brittle exact-string comparison, so we do the same:
// a student who formats their string slightly differently (spacing, quote
// style) but gets the logic right still passes.

const fs = require("fs");
const { runFunctionTests, firstErrorLine } = require("./_common");
const { raw } = require("../../lib/report");

const FUNC = "my_spaceship";
const CASES = [
  { args: ["RAALALL"], expect: { x: 2, y: -1, direction: "down" } },
  { args: ["AAAA"], expect: { x: 0, y: -4, direction: "up" } },
  { args: [""], expect: { x: 0, y: 0, direction: "up" } },
  { args: ["RAARA"], expect: { x: 2, y: 1, direction: "down" } },
];

function expectedLiteral(e) {
  return `{x: ${e.x}, y: ${e.y}, direction: '${e.direction}'}`;
}

/** Pulls x, y, direction out of the returned string, tolerant of formatting. */
function parseResult(str) {
  if (typeof str !== "string") return null;
  const x = /x\s*:\s*(-?\d+)/i.exec(str);
  const y = /y\s*:\s*(-?\d+)/i.exec(str);
  const dir = /direction\s*:\s*['"]?(\w+)['"]?/i.exec(str);
  if (!x || !y || !dir) return null;
  return { x: Number(x[1]), y: Number(y[1]), direction: dir[1].toLowerCase() };
}

function findSubmission(g) {
  // The instructions accept any language ("my_spaceship*"), but we can only
  // execute JavaScript here.
  const entries = fs.readdirSync(g.sandbox).filter((f) => /^my_spaceship\./.test(f));
  const jsFile = entries.find((f) => f.endsWith(".js"));
  return { jsFile, otherFiles: entries.filter((f) => f !== jsFile) };
}

exports.run = function (g) {
  const testCase = (i, overrides) =>
    g.testCase(Object.assign(
      { index: i, input: CASES[i].args, expectedOutput: "", expectedReturn: raw(expectedLiteral(CASES[i].expect)), output: "" },
      overrides
    ));

  const { jsFile, otherFiles } = findSubmission(g);
  if (!jsFile) {
    const detail = otherFiles.length
      ? `found ${otherFiles.join(", ")}, but this offline runner only grades JavaScript (.js) submissions`
      : "no my_spaceship.* file in this directory";
    CASES.forEach((c, i) => testCase(i, { returnValue: undefined, passed: false, detail }));
    return;
  }

  const { result, outcomes } = runFunctionTests(g, jsFile, FUNC, CASES);

  if (result.timedOut || (result.code !== 0 && outcomes.every((o) => !o.found))) {
    const detail = result.timedOut ? "the script didn't finish in time" : `node exited with ${result.code}: ${firstErrorLine(result.stderr)}`;
    CASES.forEach((c, i) => testCase(i, { returnValue: undefined, passed: false, detail }));
    return;
  }

  CASES.forEach((c, i) => {
    const o = outcomes[i];
    if (!o.found) {
      testCase(i, { returnValue: undefined, passed: false, detail: "no output for this case (a call before it likely crashed the script)" });
      return;
    }
    if (o.threw) {
      testCase(i, { returnValue: undefined, passed: false, detail: `threw: ${o.message}` });
      return;
    }
    if (o.parseError) {
      testCase(i, { returnValue: undefined, passed: false, detail: `unexpected output: ${o.raw}` });
      return;
    }

    const parsed = parseResult(o.value);
    if (!parsed) {
      testCase(i, {
        returnValue: o.value,
        passed: false,
        detail: `couldn't find x/y/direction in the returned value -- got ${JSON.stringify(o.value)}`,
      });
      return;
    }

    const ok = parsed.x === c.expect.x && parsed.y === c.expect.y && parsed.direction === c.expect.direction;
    testCase(i, {
      returnValue: o.value,
      passed: ok,
      detail: ok ? "" : `parsed x:${parsed.x}, y:${parsed.y}, direction:'${parsed.direction}'`,
    });
  });
};
