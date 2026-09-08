"use strict";

/**
 * Renders the report table exactly like real gandalf:
 *
 *       REPORT        MY-FIRST-FILE
 *
 *  Status             SUCCESS
 *  Execution Runtime  0.000065
 *  Score              [=] 1/1
 *
 * Column 1 is as wide as "Execution Runtime" (17 chars), column 2 as wide as
 * the widest value. The header row is centered (extra space biased right,
 * matching the real output), data rows are left aligned. Trailing spaces on
 * every line are intentional -- they are present in the real output.
 */

const LABELS = ["REPORT", "Status", "Execution Runtime", "Score"];

function center(text, width) {
  const left = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(left) + text.padEnd(width - left);
}

function scoreBar(passed, total) {
  passed = Math.max(0, Math.min(passed, total));
  return "[" + "=".repeat(passed) + "-".repeat(total - passed) + "] " + passed + "/" + total;
}

function render(title, status, runtimeSeconds, passed, total) {
  const values = [title, status, runtimeSeconds.toFixed(6), scoreBar(passed, total)];

  const w1 = Math.max(...LABELS.map((s) => s.length));
  const w2 = Math.max(...values.map((s) => s.length));

  const lines = [];
  lines.push(" " + center(LABELS[0], w1) + "  " + center(values[0], w2) + " ");
  lines.push("");
  for (let i = 1; i < LABELS.length; i++) {
    lines.push(" " + LABELS[i].padEnd(w1) + "  " + values[i].padEnd(w2) + " ");
  }
  return lines.join("\n");
}

module.exports = { render, scoreBar };
