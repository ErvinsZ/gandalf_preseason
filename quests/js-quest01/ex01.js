"use strict";
// #my_box must have a red (#FF0000) background. 2 points.

const { getElementById, backgroundOf, isColor } = require("../../lib/html");

const FILE = "index.html";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");

  const html = exists ? g.readText(FILE) : null;
  const box = html ? getElementById(html, "my_box") : null;
  const bg = box ? backgroundOf(html, "my_box") : null;
  const ok = isColor(bg, [255, 0, 0]);

  g.check(
    "#my_box background is red (#FF0000)",
    ok,
    !html ? "nothing to inspect" : !box ? 'no element with id="my_box" found' : `background is ${bg || "unset"}`
  );
};
