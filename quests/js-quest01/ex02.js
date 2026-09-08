"use strict";
// #my_table must contain five specific facts. 2 points.

const { getElementById, textContent } = require("../../lib/html");

const FILE = "index.html";
const FACTS = [
  "Earth is round",
  "The hashtag symbol is technically called an octothorpe",
  "Some cats are allergic to people",
  "The unicorn is the national animal of Scotland",
  "The odds of getting a royal flush are exactly 1 in 649,740",
];

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");

  const html = exists ? g.readText(FILE) : null;
  const table = html ? getElementById(html, "my_table") : null;
  const content = table ? textContent(table.inner).toLowerCase() : "";

  const missing = FACTS.filter((fact) => !content.includes(fact.toLowerCase()));
  const ok = !!table && missing.length === 0;

  g.check(
    "table lists all five facts",
    ok,
    !html
      ? "nothing to inspect"
      : !table
      ? 'no element with id="my_table" found'
      : missing.length
      ? `missing: ${missing.join("; ")}`
      : ""
  );
};
