"use strict";
// These exercises are real standalone scripts, run with real `node`, not
// embedded in HTML -- so we execute them for real rather than using the vm
// sandbox the HTML-based quests use.

function runScript(g, file, { timeout = 5000 } = {}) {
  const { code, stdout, stderr } = g.sh(`node ${JSON.stringify(file)}`, { timeout });
  return {
    code,
    stdout: stdout.toString().replace(/\r\n/g, "\n"),
    stderr: stderr.toString().replace(/\r\n/g, "\n"),
    timedOut: code === 124,
  };
}

/** Compares ignoring only a possible trailing newline difference. */
function outputMatches(actual, expected) {
  return actual === expected || actual.replace(/\n$/, "") === expected.replace(/\n$/, "");
}

/** Pulls the "SomeError: message" line out of a node stack trace, if any. */
function firstErrorLine(stderr) {
  const lines = stderr.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.find((l) => /^[A-Za-z]+Error:/.test(l)) || lines[0] || "";
}

module.exports = { runScript, outputMatches, firstErrorLine };
