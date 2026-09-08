"use strict";
// script must set `my_string` to "Learning is growing". 2 points.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";
const WANTED = "Learning is growing";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    g.check("my_string is defined", false, "nothing to inspect");
    g.check("my_string === expected sentence", false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    g.check("my_string is defined", false, "no inline <script> tag found");
    g.check("my_string === expected sentence", false, "no inline <script> tag found");
    return;
  }

  const { error, getGlobal } = runScripts(scripts);
  if (error) {
    g.check("my_string is defined", false, `script threw: ${error.message}`);
    g.check("my_string === expected sentence", false, `script threw: ${error.message}`);
    return;
  }

  const value = getGlobal("my_string");
  const defined = g.check("my_string is defined", value !== undefined, value === undefined ? "my_string is not defined" : "");
  g.check(
    "my_string === expected sentence",
    value === WANTED,
    !defined ? "nothing to inspect" : value === WANTED ? "" : `my_string is ${JSON.stringify(value)}`
  );
};
