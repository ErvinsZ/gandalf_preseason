"use strict";
// document.getElementById('my_box').style.backgroundColor must end up green
// (#00FF00). 2 points: the element was actually looked up, and the colour is
// right. Uses a minimal document stub since real DOM would mean a jsdom
// dependency for one exercise.

const { extractScripts, runScripts, makeDomStub, isColor } = require("../../lib/html");

const FILE = "index.html";

exports.run = function (g) {
  const exists = g.check(`${FILE} exists`, g.isFile(FILE), g.exists(FILE) ? "" : "no such file in this directory");
  if (!exists) {
    g.check("script selects #my_box", false, "nothing to inspect");
    g.check("#my_box background ends up green (#00FF00)", false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    g.check("script selects #my_box", false, "no inline <script> tag found");
    g.check("#my_box background ends up green (#00FF00)", false, "no inline <script> tag found");
    return;
  }

  const { document, elements } = makeDomStub();
  const { error } = runScripts(scripts, { extraGlobals: { document } });

  if (error) {
    g.check("script selects #my_box", false, `script threw: ${error.message}`);
    g.check("#my_box background ends up green (#00FF00)", false, `script threw: ${error.message}`);
    return;
  }

  const touched = g.check(
    "script selects #my_box",
    !!elements.my_box,
    elements.my_box ? "" : "document.getElementById('my_box') was never called"
  );

  const bg = touched ? elements.my_box.style.backgroundColor : null;
  const ok = isColor(bg, [0, 255, 0]);
  g.check(
    "#my_box background ends up green (#00FF00)",
    ok,
    !touched ? "nothing to inspect" : ok ? "" : `background is ${bg || "unset"}`
  );
};
