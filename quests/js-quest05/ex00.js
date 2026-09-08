"use strict";
// The script must print every CLI argument it receives, one per line,
// unmodified (including args that contain spaces). 3 points, one per case.

const { runScript, outputMatches, firstErrorLine } = require("./_common");

const FILE = "my_first_script_with_args.js";

const CASES = [
  { args: ["blah1"] },
  { args: ["blah1", "blah2", "blah3"] },
  { args: ["foo bar", "baz"] }, // an arg containing a space must stay intact
];

exports.run = function (g) {
  if (!g.isFile(FILE)) {
    for (const c of CASES) {
      g.check(`prints ${JSON.stringify(c.args)}`, false, g.exists(FILE) ? "" : "no such file in this directory");
    }
    return;
  }

  for (const c of CASES) {
    const label = `prints ${JSON.stringify(c.args)}`;
    const expected = c.args.join("\n") + "\n";
    const result = runScript(g, FILE, { args: c.args });

    if (result.timedOut) {
      g.check(label, false, "the script didn't finish in time");
      continue;
    }
    if (result.code !== 0) {
      g.check(label, false, `node exited with ${result.code}: ${firstErrorLine(result.stderr)}`);
      continue;
    }
    const ok = outputMatches(result.stdout, expected);
    g.check(label, ok, ok ? "" : `printed ${JSON.stringify(result.stdout)}`);
  }
};
