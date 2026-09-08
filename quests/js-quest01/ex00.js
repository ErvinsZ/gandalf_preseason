"use strict";
// index.html must contain an <h1> reading "Hello World". 2 points.

const { getTag, textContent } = require("../../lib/html");

const FILE = "index.html";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");

  const html = exists ? g.readText(FILE) : null;
  const h1 = html ? getTag(html, "h1") : null;
  const text = h1 ? textContent(h1.inner) : null;
  const ok = text === "Hello World";

  g.check(
    'h1 tag says "Hello World"',
    ok,
    !html ? "nothing to inspect" : !h1 ? "no <h1> tag found" : `<h1> says ${JSON.stringify(text)}`
  );
};
