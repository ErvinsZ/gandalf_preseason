"use strict";
// Two if-statements over six fixed variables must both print. 1 point,
// matching Qwasar's own single-check scoring for this exercise (unlike the
// HTML version of the same exercise in js-quest02, which scores it more
// granularly).

const { runScript, outputMatches, firstErrorLine } = require("./_common");

const FILE = "my_first_if_multiple_conditions.js";
const EXPECTED = "a is bigger than b AND smaller than c AND equal to d\nz OR y are bigger than a\n";
const LABEL = "prints both conditional messages";

exports.run = function (g) {
  if (!g.isFile(FILE)) {
    g.check(LABEL, false, g.exists(FILE) ? "" : "no such file in this directory");
    return;
  }

  const result = runScript(g, FILE);
  if (result.timedOut) {
    g.check(LABEL, false, "the script didn't finish in time");
    return;
  }
  if (result.code !== 0) {
    g.check(LABEL, false, `node exited with ${result.code}: ${firstErrorLine(result.stderr)}`);
    return;
  }

  const ok = outputMatches(result.stdout, EXPECTED);
  g.check(LABEL, ok, ok ? "" : `printed ${JSON.stringify(result.stdout)}`);
};
