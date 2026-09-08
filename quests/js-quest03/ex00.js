"use strict";
// A while loop must print "I want to code" exactly 100 times. 2 points.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";
const LINE = "I want to code";
const WANTED_COUNT = 100;

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    g.check(`prints "${LINE}" exactly ${WANTED_COUNT} times`, false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    g.check(`prints "${LINE}" exactly ${WANTED_COUNT} times`, false, "no inline <script> tag found");
    return;
  }

  const { error, logs } = runScripts(scripts, { timeout: 3000 });
  if (error) {
    const timedOut = /timed out/i.test(error.message);
    g.check(
      `prints "${LINE}" exactly ${WANTED_COUNT} times`,
      false,
      timedOut
        ? "the script didn't finish in time -- check the loop actually increments and stops"
        : `script threw: ${error.message}`
    );
    return;
  }

  const ok = logs.length === WANTED_COUNT && logs.every((l) => l === LINE);
  let detail = "";
  if (!ok) {
    const wrongText = logs.find((l) => l !== LINE);
    detail =
      wrongText !== undefined
        ? `printed ${JSON.stringify(wrongText)} instead of ${JSON.stringify(LINE)}`
        : `printed ${logs.length} times, expected ${WANTED_COUNT}`;
  }
  g.check(`prints "${LINE}" exactly ${WANTED_COUNT} times`, ok, detail);
};
