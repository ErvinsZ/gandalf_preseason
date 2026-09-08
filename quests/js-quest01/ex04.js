"use strict";
// The inline <script> must console.log("My first print"). 1 point.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";
const WANTED = "My first print";

exports.run = function (g) {
  const html = g.isFile(FILE) ? g.readText(FILE) : null;
  const scripts = html ? extractScripts(html) : [];

  if (!html) {
    g.check(`console.log("${WANTED}")`, false, "no index.html found");
    return;
  }
  if (!scripts.length) {
    g.check(`console.log("${WANTED}")`, false, "no inline <script> tag found");
    return;
  }

  const { error, logs } = runScripts(scripts);
  if (error) {
    g.check(`console.log("${WANTED}")`, false, `script threw: ${error.message}`);
    return;
  }

  const ok = logs.includes(WANTED);
  g.check(
    `console.log("${WANTED}")`,
    ok,
    ok ? "" : logs.length ? `console.log printed: ${logs.join(" | ")}` : "console.log was never called"
  );
};
