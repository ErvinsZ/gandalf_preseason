"use strict";
// my_first_function must exist and print "my_first_function" when called.
// 1 point. The fixed template already calls it, so a missing/misnamed
// function throws a ReferenceError, surfaced directly via node's exit code.

const { runScript, outputMatches, firstErrorLine } = require("./_common");

const FILE = "my_first_function.js";
const EXPECTED = "my_first_function\n";
const LABEL = 'prints "my_first_function"';

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
    g.check(LABEL, false, `node exited with ${result.code}: ${firstErrorLine(result.stderr)} (is my_first_function defined?)`);
    return;
  }

  const ok = outputMatches(result.stdout, EXPECTED);
  g.check(LABEL, ok, ok ? "" : `printed ${JSON.stringify(result.stdout)}`);
};
