"use strict";
// The inline <script> must set a variable named age to 34. 2 points.
// This is executed for real (Node's vm module), not pattern-matched.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");

  const html = exists ? g.readText(FILE) : null;
  const scripts = html ? extractScripts(html) : [];

  if (!html) {
    g.check("age === 34", false, "nothing to inspect");
    return;
  }
  if (!scripts.length) {
    g.check("age === 34", false, "no inline <script> tag found");
    return;
  }

  const { error, getGlobal } = runScripts(scripts);
  if (error) {
    g.check("age === 34", false, `script threw: ${error.message}`);
    return;
  }

  const age = getGlobal("age");
  const ok = age === 34;
  g.check(
    "age === 34",
    ok,
    ok ? "" : age === undefined ? "age is not defined" : `age is ${JSON.stringify(age)} (expected the number 34)`
  );
};
