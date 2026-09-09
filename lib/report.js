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

/** Wrap a pre-formatted string to display unquoted in the detail table
 * (e.g. an object-literal-style expected value, `{x: 2, direction: 'down'}`,
 * shown next to an actual value that's a genuine quoted string). */
class RawText {
  constructor(text) {
    this.text = String(text);
  }
}
function raw(text) {
  return new RawText(text);
}

function repr(value) {
  if (value instanceof RawText) return value.text;
  if (value === undefined) return "";
  if (typeof value === "number" && !isFinite(value)) return String(value); // NaN/Infinity
  if (typeof value === "number") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const DETAIL_LABELS = ["Input", "Expected Output", "Expected Return Value", "Output", "Return Value"];

/**
 * Renders one "TEST CASE N" sub-table:
 *
 *       TEST CASE 0        SUCCESS
 *
 *  Input                  "GGACTGA"
 *                         "GGACTGA"
 *  Expected Output        ""
 *  Expected Return Value          0
 *  Output                 ""
 *  Return Value                   0
 *
 * Numbers are right-aligned, everything else left-aligned -- matching the
 * real gandalf output. Multiple inputs stack under one "Input" label.
 */
function renderTestCase(tc) {
  const w1 = Math.max(...DETAIL_LABELS.map((s) => s.length));

  const rows = [];
  if (tc.input.length === 0) {
    rows.push({ label: "Input", text: "", numeric: false });
  } else {
    tc.input.forEach((v, i) => rows.push({ label: i === 0 ? "Input" : "", text: repr(v), numeric: typeof v === "number" }));
  }
  rows.push({ label: "Expected Output", text: repr(tc.expectedOutput), numeric: false });
  rows.push({ label: "Expected Return Value", text: repr(tc.expectedReturn), numeric: typeof tc.expectedReturn === "number" });
  rows.push({ label: "Output", text: repr(tc.output), numeric: false });
  rows.push({ label: "Return Value", text: repr(tc.returnValue), numeric: typeof tc.returnValue === "number" });

  const w2 = Math.max(...rows.map((r) => r.text.length));
  const status = tc.passed ? "SUCCESS" : "FAILURE";
  const statusColor = tc.passed ? color.green : color.red;

  const lines = [];
  lines.push(color.badge(" " + center(`TEST CASE ${tc.index}`, w1)) + "  " + statusColor(center(status, w2)) + " ");
  lines.push("");
  for (const r of rows) {
    const cell = r.numeric ? r.text.padStart(w2) : r.text.padEnd(w2);
    lines.push(" " + r.label.padEnd(w1) + "  " + cell + " ");
  }
  return lines.join("\n");
}

module.exports = { render, scoreBar, renderTestCase, raw };
