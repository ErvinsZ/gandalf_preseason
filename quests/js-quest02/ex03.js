"use strict";
// my_index = 0, then ++, print, --, --, print, ++, ++, ++, print. 3 points,
// one per expected printed value: 1, -1, 2.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";
const EXPECTED = ["1", "-1", "2"];

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    for (const v of EXPECTED) g.check(`console.log prints ${v}`, false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    for (const v of EXPECTED) g.check(`console.log prints ${v}`, false, "no inline <script> tag found");
    return;
  }

  const { error, logs } = runScripts(scripts);
  if (error) {
    for (const v of EXPECTED) g.check(`console.log prints ${v}`, false, `script threw: ${error.message}`);
    return;
  }

  for (let i = 0; i < EXPECTED.length; i++) {
    const got = logs[i];
    const ok = got === EXPECTED[i];
    g.check(
      `console.log prints ${EXPECTED[i]} (call ${i + 1})`,
      ok,
      ok ? "" : got === undefined ? "console.log was not called that many times" : `got ${JSON.stringify(got)}`
    );
  }
};
