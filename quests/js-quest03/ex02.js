"use strict";
// A while loop calls detonation_in(timer) from 10 down to 1 inclusive (not 0).
// 4 points: exists, exactly 10 calls, starts at 10, ends at 1.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";
const line = (n) => `detonation in... ${n} seconds.`;

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  const labels = [
    "prints exactly 10 lines",
    "first line counts down from 10",
    "last line stops at 1 (never prints 0)",
  ];

  if (!exists) {
    for (const l of labels) g.check(l, false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    for (const l of labels) g.check(l, false, "no inline <script> tag found");
    return;
  }

  const { error, logs } = runScripts(scripts, { timeout: 3000 });
  if (error) {
    const timedOut = /timed out/i.test(error.message);
    const detail = timedOut
      ? "the script didn't finish in time -- check the loop actually decrements and stops"
      : `script threw: ${error.message}`;
    for (const l of labels) g.check(l, false, detail);
    return;
  }

  g.check("prints exactly 10 lines", logs.length === 10, logs.length === 10 ? "" : `printed ${logs.length} lines`);
  g.check(
    "first line counts down from 10",
    logs[0] === line(10),
    logs[0] === line(10) ? "" : `first line was ${JSON.stringify(logs[0])}`
  );
  const last = logs[logs.length - 1];
  g.check(
    "last line stops at 1 (never prints 0)",
    last === line(1),
    last === line(1)
      ? ""
      : last === line(0)
      ? "the loop printed 0 -- it should stop once timer reaches 0, not include it"
      : `last line was ${JSON.stringify(last)}`
  );
};
