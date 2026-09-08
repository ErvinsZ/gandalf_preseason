"use strict";
// my_first_function must exist and print "my_first_function" when called.
// 2 points. The fixed template already calls it, so a missing/misnamed
// function throws a ReferenceError at that call, which we surface directly.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";
const WANTED = "my_first_function";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    g.check(`console.log("${WANTED}")`, false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    g.check(`console.log("${WANTED}")`, false, "no inline <script> tag found");
    return;
  }

  const { error, logs } = runScripts(scripts);
  if (error) {
    g.check(`console.log("${WANTED}")`, false, `script threw: ${error.message} (is my_first_function defined?)`);
    return;
  }

  const ok = logs.includes(WANTED);
  g.check(
    `console.log("${WANTED}")`,
    ok,
    ok ? "" : logs.length ? `console.log printed: ${logs.join(" | ")}` : "console.log was never called"
  );
};
