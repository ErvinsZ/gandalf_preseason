"use strict";
// script must set `letter` to the single character 'c'. 2 points.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    g.check("letter is defined", false, "nothing to inspect");
    g.check("letter === 'c'", false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    g.check("letter is defined", false, "no inline <script> tag found");
    g.check("letter === 'c'", false, "no inline <script> tag found");
    return;
  }

  const { error, getGlobal } = runScripts(scripts);
  if (error) {
    g.check("letter is defined", false, `script threw: ${error.message}`);
    g.check("letter === 'c'", false, `script threw: ${error.message}`);
    return;
  }

  const letter = getGlobal("letter");
  const defined = g.check("letter is defined", letter !== undefined, letter === undefined ? "letter is not defined" : "");
  g.check(
    "letter === 'c'",
    letter === "c",
    !defined
      ? "nothing to inspect"
      : letter === "c"
      ? ""
      : `letter is ${JSON.stringify(letter)} (expected the single character 'c')`
  );
};
