"use strict";
// my_levenshtein(s1, s2): -1 if lengths differ, else the count of differing
// character positions. 4 points, matching the 4 given examples.
//
// This exercise's real gandalf output includes a "Checks detail Report"
// table per test case (Input/Expected Output/Expected Return Value/Output/
// Return Value) rather than the simple KO-line list every other quest uses
// so far -- handled via Grader.testCase(), which both records that detail
// and feeds the normal pass/fail tally.

const fs = require("fs");
const { runFunctionTests, firstErrorLine } = require("./_common");

const FUNC = "my_levenshtein";
const CASES = [
  { args: ["GGACTGA", "GGACTGA"], expect: 0 },
  { args: ["ACCAGGG", "ACTATGG"], expect: 2 },
  { args: ["GGACGGATTCTG", "AGG"], expect: -1 },
  { args: ["", ""], expect: 0 },
];

function findSubmission(g) {
  // The instructions accept any language ("my_levenshtein*"), but we can
  // only execute JavaScript here.
  const entries = fs.readdirSync(g.sandbox).filter((f) => /^my_levenshtein\./.test(f));
  const jsFile = entries.find((f) => f.endsWith(".js"));
  return { jsFile, otherFiles: entries.filter((f) => f !== jsFile) };
}

exports.run = function (g) {
  const { jsFile, otherFiles } = findSubmission(g);

  if (!jsFile) {
    const detail = otherFiles.length
      ? `found ${otherFiles.join(", ")}, but this offline runner only grades JavaScript (.js) submissions`
      : "no my_levenshtein.* file in this directory";
    CASES.forEach((c, i) => g.testCase({
      label: `test case ${i}`, index: i, input: c.args, expectedOutput: "", expectedReturn: c.expect,
      output: "", returnValue: undefined, passed: false, detail,
    }));
    return;
  }

  const { result, outcomes } = runFunctionTests(g, jsFile, FUNC, CASES);

  if (result.timedOut || (result.code !== 0 && outcomes.every((o) => !o.found))) {
    const detail = result.timedOut ? "the script didn't finish in time" : `node exited with ${result.code}: ${firstErrorLine(result.stderr)}`;
    CASES.forEach((c, i) => g.testCase({
      label: `test case ${i}`, index: i, input: c.args, expectedOutput: "", expectedReturn: c.expect,
      output: "", returnValue: undefined, passed: false, detail,
    }));
    return;
  }

  CASES.forEach((c, i) => {
    const o = outcomes[i];
    let returnValue, passed, detail = "";
    if (!o.found) {
      passed = false;
      detail = "no output for this case (a call before it likely crashed the script)";
    } else if (o.threw) {
      passed = false;
      detail = `threw: ${o.message}`;
    } else if (o.parseError) {
      passed = false;
      detail = `unexpected output: ${o.raw}`;
    } else {
      returnValue = o.value;
      passed = returnValue === c.expect;
    }

    g.testCase({
      label: `test case ${i}`,
      index: i,
      input: c.args,
      expectedOutput: "",
      expectedReturn: c.expect,
      output: "",
      returnValue,
      passed,
      detail,
    });
  });
};
