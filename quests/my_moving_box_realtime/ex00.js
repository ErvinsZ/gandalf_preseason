"use strict";
// The script must move #my_box_realtime to right:0, bottom:0 by changing
// position 1 unit every 0.5s (~35s total for the given start position of 70).
// 1 point: a single test case whose Output is built from which dimensions
// were confirmed moving correctly, matching Qwasar's own detail-report shape
// for this exercise.
//
// We don't want `gandalf` to actually block for 35+ real seconds, so this
// uses a deterministic fake clock: setInterval/setTimeout are replaced with
// versions that just record { callback, delay }, and a virtual clock jumps
// directly from one due event to the next rather than waiting in real time.
// This still rigorously checks *pacing* (not just the final position) --
// a script that jumps straight to 0 immediately is told apart from one that
// steps through it correctly, since we inspect every intermediate value.

const vm = require("vm");
const { extractScripts, getElementById, getAttr, parseInlineStyle, isZeroLength } = require("../../lib/html");

const FILE = "index.html";
const EXPECTED_OUTPUT = "box moving Y dimension and box moving X dimension";

function makeFakeClock() {
  let now = 0;
  let nextId = 1;
  const intervals = new Map();
  const timeouts = new Map();

  function setInterval(fn, delay) {
    const id = nextId++;
    intervals.set(id, { fn, delay, next: now + delay });
    return id;
  }
  function clearInterval(id) {
    intervals.delete(id);
  }
  function setTimeout(fn, delay) {
    const id = nextId++;
    timeouts.set(id, { fn, time: now + delay });
    return id;
  }
  function clearTimeout(id) {
    timeouts.delete(id);
  }

  /** Jumps directly from due event to due event, up to `target` ms. */
  function advanceTo(target) {
    for (;;) {
      let nextTime = Infinity;
      for (const iv of intervals.values()) nextTime = Math.min(nextTime, iv.next);
      for (const to of timeouts.values()) nextTime = Math.min(nextTime, to.time);
      if (nextTime === Infinity || nextTime > target) break;
      now = nextTime;
      for (const [id, to] of Array.from(timeouts.entries())) {
        if (to.time === now) {
          timeouts.delete(id);
          try { to.fn(); } catch { /* let the exercise's own logic surface issues in state, not here */ }
        }
      }
      for (const [id, iv] of Array.from(intervals.entries())) {
        if (iv.next === now) {
          iv.next += iv.delay;
          try { iv.fn(); } catch { /* ditto */ }
        }
      }
    }
    now = target;
  }

  return { setInterval, clearInterval, setTimeout, clearTimeout, advanceTo, get now() { return now; }, get activeIntervals() { return intervals.size; } };
}

/** A style object that records every right/bottom assignment with its virtual timestamp. */
function makeTrackedElement(clock, initialStyle) {
  const data = Object.assign({}, initialStyle);
  const history = { right: [], bottom: [] };
  const style = new Proxy(data, {
    get: (target, prop) => target[prop],
    set(target, prop, value) {
      target[prop] = value;
      if (prop === "right" || prop === "bottom") history[prop].push({ time: clock.now, value });
      return true;
    },
  });
  return { style, history };
}

/** Checks one dimension's recorded history: steady -1 steps down to 0 over ~35s. */
function analyzeDimension(label, history) {
  if (!history.length) return { ok: false, reason: `style.${label === "Y" ? "bottom" : "right"} was never assigned` };

  const distinct = [];
  for (const h of history) {
    if (!distinct.length || distinct[distinct.length - 1].value !== h.value) distinct.push(h);
  }

  for (let i = 1; i < distinct.length; i++) {
    const prev = parseFloat(distinct[i - 1].value);
    const cur = parseFloat(distinct[i].value);
    if (prev - cur !== 1) {
      return { ok: false, reason: `${label} dimension jumped from ${distinct[i - 1].value} to ${distinct[i].value} instead of moving by exactly 1` };
    }
  }

  const last = distinct[distinct.length - 1];
  if (!isZeroLength(last.value)) {
    return { ok: false, reason: `${label} dimension stopped at ${last.value} instead of reaching 0` };
  }
  if (distinct.length < 10) {
    return { ok: false, reason: `${label} dimension only took ${distinct.length} step(s) -- expected roughly 70 one-unit steps` };
  }

  const elapsedSeconds = (last.time - distinct[0].time) / 1000;
  if (elapsedSeconds < 25 || elapsedSeconds > 45) {
    return { ok: false, reason: `${label} dimension reached 0 after ${elapsedSeconds.toFixed(1)}s, expected roughly 35s` };
  }

  return { ok: true };
}

exports.run = function (g) {
  const testCase = (overrides) =>
    g.testCase(Object.assign({ index: 0, input: [], expectedOutput: EXPECTED_OUTPUT, expectedReturn: undefined, returnValue: undefined }, overrides));

  if (!g.isFile(FILE)) {
    testCase({ output: "", passed: false, detail: g.exists(FILE) ? "" : "no such file in this directory" });
    return;
  }

  const html = g.readText(FILE);
  const scripts = extractScripts(html);
  if (!scripts.length) {
    testCase({ output: "", passed: false, detail: "no inline <script> tag found" });
    return;
  }

  const el = getElementById(html, "my_box_realtime");
  const initialStyle = el ? parseInlineStyle(getAttr(el.attrs, "style")) : {};

  const clock = makeFakeClock();
  const tracked = makeTrackedElement(clock, initialStyle);
  const document = {
    getElementById: (id) => (id === "my_box_realtime" ? { id, style: tracked.style } : { id, style: {} }),
  };
  const sandbox = {
    document,
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
    testCase({ output: "", passed: false, detail: `script threw: ${error.message}` });
    return;
  }

  clock.advanceTo(40000); // simulate 40 virtual seconds; the trip should take ~35

  const yResult = analyzeDimension("Y", tracked.history.bottom);
  const xResult = analyzeDimension("X", tracked.history.right);

  const messages = [];
  if (yResult.ok) messages.push("box moving Y dimension");
  if (xResult.ok) messages.push("box moving X dimension");

  const detail = [yResult.ok ? null : yResult.reason, xResult.ok ? null : xResult.reason].filter(Boolean).join("; ");

  testCase({ output: messages.join(" and "), passed: yResult.ok && xResult.ok, detail });
};
