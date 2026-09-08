"use strict";
// my_age (34), my_name ("Luke"), my_comma (",") combined into one sentence.
// 1 point.

const { runScript, outputMatches, firstErrorLine } = require("./_common");

const FILE = "my_multiple_variables_multiple_type.js";
const EXPECTED = "Hello Luke, I'm 34 years old.\n";
const LABEL = "prints the full sentence";

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
