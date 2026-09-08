"use strict";
// document.getElementById('my_box').style must end up with right: 0 and
// bottom: 0, set purely by JS (the given HTML can't be edited). 2 points.

const {
  extractScripts, runScripts, makeDomStub, getElementById, getAttr, parseInlineStyle, isZeroLength,
} = require("../../lib/html");

const FILE = "index.html";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    g.check("#my_box ends up at right: 0; bottom: 0", false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    g.check("#my_box ends up at right: 0; bottom: 0", false, "no inline <script> tag found");
    return;
  }

  const { document, elements } = makeDomStub();
  const el = getElementById(html, "my_box");
  if (el) {
    elements.my_box = { id: "my_box", style: parseInlineStyle(getAttr(el.attrs, "style")) };
  }

  const { error } = runScripts(scripts, { extraGlobals: { document } });
  if (error) {
    g.check("#my_box ends up at right: 0; bottom: 0", false, `script threw: ${error.message}`);
    return;
  }

  const style = elements.my_box ? elements.my_box.style : {};
  const ok = isZeroLength(style.right) && isZeroLength(style.bottom);
  g.check(
    "#my_box ends up at right: 0; bottom: 0",
    ok,
    ok
      ? ""
      : !elements.my_box
      ? "document.getElementById('my_box') was never called"
      : `right is ${JSON.stringify(style.right)}, bottom is ${JSON.stringify(style.bottom)}`
  );
};
