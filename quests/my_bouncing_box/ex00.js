"use strict";
// A div must bounce diagonally off the (virtual) screen edges, reversing
// direction on each axis independently on contact, and its placeholder text
// must be replaced. 6 points, matching the 6 named checks in the real
// output (two of which are near-duplicate file-existence assertions --
// apparently shared boilerplate from Qwasar's own test suite, kept verbatim
// for fidelity even though only index.html is actually required here).
//
// We don't know the exact virtual screen size the real grader assumes, and
// the exercise's own tips don't mention reading window.innerWidth/Height --
// students may just hardcode their own bounce thresholds. So rather than
// enforcing a specific viewport, this checks the behavior itself is
// self-consistently bounded: does position actually reverse direction
// (a "bounce") rather than drift or run away unbounded, on both axes.

const vm = require("vm");
const { makeFakeClock } = require("../../lib/faketime");
const { extractScripts, getElementById, getAttr, parseInlineStyle, textContent } = require("../../lib/html");

const FILE = "index.html";
const PLACEHOLDER = "not loaded";
const SIM_MS = 300000; // generous virtual headroom -- see comment above on why
const SANITY_MIN = -2000;
const SANITY_MAX = 10000;

function makeElement(clock, initialText, dims) {
  const history = { left: [], top: [] };
  let text = initialText;
  const styleData = {};
  const style = new Proxy(styleData, {
    get: (t, p) => t[p],
    set(t, p, v) {
      t[p] = v;
      if (p === "left" || p === "top") history[p].push({ time: clock.now, value: v });
      return true;
    },
  });

  const el = {
    style,
    offsetWidth: dims.width,
    offsetHeight: dims.height,
    clientWidth: dims.width,
    clientHeight: dims.height,
    getBoundingClientRect() {
      const left = parseFloat(styleData.left) || 0;
      const top = parseFloat(styleData.top) || 0;
      return { left, top, width: dims.width, height: dims.height, right: left + dims.width, bottom: top + dims.height };
    },
  };
  for (const prop of ["textContent", "innerText", "innerHTML"]) {
    Object.defineProperty(el, prop, { get: () => text, set: (v) => { text = v; } });
  }
  return { el, history, getText: () => text };
}

/** Distinct values (deduped consecutive) and direction-reversal count for a series. */
function analyzeAxis(history) {
  const nums = history.map((h) => parseFloat(h.value)).filter((v) => !Number.isNaN(v));
  const distinct = [];
  for (const v of nums) if (!distinct.length || distinct[distinct.length - 1] !== v) distinct.push(v);

  let reversals = 0;
  let lastDir = null;
  for (let i = 1; i < distinct.length; i++) {
    const dir = Math.sign(distinct[i] - distinct[i - 1]);
    if (dir !== 0) {
      if (lastDir !== null && dir !== lastDir) reversals++;
      lastDir = dir;
    }
  }
  return {
    distinctCount: distinct.length,
    reversals,
    min: distinct.length ? Math.min(...distinct) : null,
    max: distinct.length ? Math.max(...distinct) : null,
  };
}

exports.run = function (g) {
  const hasHtml = g.isFile(FILE);
  g.check("is there an index.html and a style.css?", hasHtml, hasHtml ? "" : "no such file in this directory");
  g.check("is there an index.html and a style.css? (2)", hasHtml, hasHtml ? "" : "no such file in this directory");

  const labels = [
    "content of the div my_bouncing_box has been replaced?",
    "simple bouncing on 'wall'?",
    "box is moving diagonally?",
    "box is not going off screen?",
  ];

  if (!hasHtml) {
    for (const l of labels) g.check(l, false, "nothing to inspect");
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    for (const l of labels) g.check(l, false, "no inline <script> tag found");
    return;
  }

  const boxEl = getElementById(html, "my_bouncing_box");
  const initialText = boxEl ? textContent(boxEl.inner) : "";
  const boxStyle = boxEl ? parseInlineStyle(getAttr(boxEl.attrs, "style")) : {};
  const dims = {
    width: parseFloat(boxStyle.width) || parseFloat(boxStyle["min-width"]) || 0,
    height: parseFloat(boxStyle.height) || parseFloat(boxStyle["min-height"]) || 0,
  };

  const clock = makeFakeClock();
  const tracked = makeElement(clock, initialText, dims);
  const document = {
    getElementById: (id) => (id === "my_bouncing_box" ? tracked.el : { style: {} }),
  };
  const sandbox = {
    document,
    window: { innerWidth: 1024, innerHeight: 768 },
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    console: { log() {}, error() {}, warn() {}, info() {} },
  };
  const context = vm.createContext(sandbox);

  let error = null;
  for (const src of scripts) {
    try {
      new vm.Script(src, { filename: "index.html" }).runInContext(context, { timeout: 2000 });
    } catch (e) {
      error = e;
      break;
    }
  }
  if (error) {
    for (const l of labels) g.check(l, false, `script threw: ${error.message}`);
    return;
  }

  clock.advanceTo(SIM_MS);

  // -- content replaced --
  const finalText = (tracked.getText() || "").trim();
  const contentOk = finalText.length > 0 && finalText.toLowerCase() !== PLACEHOLDER;
  g.check(
    labels[0],
    contentOk,
    contentOk ? "" : finalText.toLowerCase() === PLACEHOLDER ? "still shows the default \"Not loaded\" text" : "content is empty"
  );

  const x = analyzeAxis(tracked.history.left);
  const y = analyzeAxis(tracked.history.top);

  // -- bounces off a wall --
  const totalReversals = x.reversals + y.reversals;
  const bounceOk = totalReversals >= 2;
  g.check(
    labels[1],
    bounceOk,
    bounceOk ? "" : `only ${totalReversals} direction reversal(s) detected in ${(SIM_MS / 1000).toFixed(0)}s -- expected 2-3 bounces`
  );

  // -- moves on both axes (diagonal, not just horizontal or vertical) --
  const diagonalOk = x.distinctCount >= 2 && y.distinctCount >= 2;
  g.check(
    labels[2],
    diagonalOk,
    diagonalOk
      ? ""
      : x.distinctCount < 2 && y.distinctCount < 2
      ? "style.left and style.top were never changed"
      : `${x.distinctCount < 2 ? "style.left" : "style.top"} never changed -- movement is only on one axis`
  );

  // -- stays within a sane, bounded range on both axes --
  const inRange = (a) => a.min === null || (a.min >= SANITY_MIN && a.max <= SANITY_MAX);
  const offscreenOk = inRange(x) && inRange(y);
  g.check(
    labels[3],
    offscreenOk,
    offscreenOk
      ? ""
      : `position reached x:[${x.min},${x.max}] y:[${y.min},${y.max}], well beyond a plausible screen -- looks unbounded`
  );
};
