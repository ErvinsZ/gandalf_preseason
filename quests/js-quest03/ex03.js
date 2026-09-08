"use strict";
// my_get_seven() must return the number 7. 3 points: exists, the printed
// output is correct, and -- separately -- the return value is really a
// number (not a string that happens to print the same way).

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    g.check("console.log(my_get_seven()) prints 7", false, "nothing to inspect");
    g.check("my_get_seven() returns the number 7", false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    g.check("console.log(my_get_seven()) prints 7", false, "no inline <script> tag found");
    g.check("my_get_seven() returns the number 7", false, "no inline <script> tag found");
    return;
  }

  const { error, logs, callFunction } = runScripts(scripts);
  if (error) {
    g.check("console.log(my_get_seven()) prints 7", false, `script threw: ${error.message}`);
    g.check("my_get_seven() returns the number 7", false, `script threw: ${error.message}`);
    return;
  }

  const printedOk = logs.includes("7");
  g.check(
    "console.log(my_get_seven()) prints 7",
    printedOk,
    printedOk ? "" : logs.length ? `console.log printed: ${logs.join(" | ")}` : "console.log was never called"
  );

  const result = callFunction("my_get_seven");
  const returnOk = result.ok && result.value === 7 && typeof result.value === "number";
  g.check(
    "my_get_seven() returns the number 7",
    returnOk,
    returnOk
      ? ""
      : !result.ok
      ? result.reason === "not-a-function"
        ? "my_get_seven is not defined as a function"
        : `calling it threw: ${result.message}`
      : `returned ${JSON.stringify(result.value)} (a ${typeof result.value}), expected the number 7`
  );
};
