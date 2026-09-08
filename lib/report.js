"use strict";

const color = require("./color");

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
 *
 * Padding widths are always computed from the plain (uncolored) strings;
 * color codes are applied afterwards so they don't throw off alignment.
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

/** Colors `text` then pads with plain spaces to keep the column aligned. */
function coloredCell(colorFn, text, width) {
  return colorFn(text) + " ".repeat(Math.max(0, width - text.length));
}

function render(title, status, runtimeSeconds, passed, total) {
  const values = [title, status, runtimeSeconds.toFixed(6), scoreBar(passed, total)];

  const w1 = Math.max(...LABELS.map((s) => s.length));
  const w2 = Math.max(...values.map((s) => s.length));
  const statusColor = passed === total ? color.green : color.red;

  const lines = [];
  lines.push(color.badge(" " + center(LABELS[0], w1)) + "  " + center(values[0], w2) + " ");
  lines.push("");
  lines.push(" " + LABELS[1].padEnd(w1) + "  " + coloredCell(statusColor, values[1], w2) + " ");
  lines.push(" " + LABELS[2].padEnd(w1) + "  " + values[2].padEnd(w2) + " ");
  lines.push(" " + LABELS[3].padEnd(w1) + "  " + coloredCell(statusColor, values[3], w2) + " ");
  return lines.join("\n");
}

module.exports = { render, scoreBar };
