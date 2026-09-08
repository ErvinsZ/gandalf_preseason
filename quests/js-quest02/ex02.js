"use strict";
// my_age (number), my_name (string), my_comma (string), and a console.log
// combining all three. 7 points: value + type for each variable, plus the
// printed sentence.

const { extractScripts, runScripts } = require("../../lib/html");

const FILE = "index.html";
const EXPECTED_LINE = "Hello Luke, I'm 34 years old.";

const VARS = [
  { name: "my_age", value: 34, type: "number" },
  { name: "my_name", value: "Luke", type: "string" },
  { name: "my_comma", value: ",", type: "string" },
];

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    for (const v of VARS) {
      g.check(`${v.name} === ${JSON.stringify(v.value)}`, false, "nothing to inspect");
      g.check(`${v.name} is a ${v.type}`, false, "nothing to inspect");
    }
    g.check("console.log prints the full sentence", false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    for (const v of VARS) {
      g.check(`${v.name} === ${JSON.stringify(v.value)}`, false, "no inline <script> tag found");
      g.check(`${v.name} is a ${v.type}`, false, "no inline <script> tag found");
    }
    g.check("console.log prints the full sentence", false, "no inline <script> tag found");
    return;
  }

  const { error, getGlobal, logs } = runScripts(scripts);
  if (error) {
    for (const v of VARS) {
      g.check(`${v.name} === ${JSON.stringify(v.value)}`, false, `script threw: ${error.message}`);
      g.check(`${v.name} is a ${v.type}`, false, `script threw: ${error.message}`);
    }
    g.check("console.log prints the full sentence", false, `script threw: ${error.message}`);
    return;
  }

  for (const v of VARS) {
    const actual = getGlobal(v.name);
    g.check(
      `${v.name} === ${JSON.stringify(v.value)}`,
      actual === v.value,
      actual === v.value ? "" : `${v.name} is ${JSON.stringify(actual)}`
    );
    g.check(
      `${v.name} is a ${v.type}`,
      typeof actual === v.type,
      typeof actual === v.type ? "" : `${v.name} is a ${typeof actual}, expected ${v.type}`
    );
  }

  const ok = logs.includes(EXPECTED_LINE);
  g.check(
    "console.log prints the full sentence",
    ok,
    ok ? "" : logs.length ? `console.log printed: ${logs.join(" | ")}` : "console.log was never called"
  );
};
