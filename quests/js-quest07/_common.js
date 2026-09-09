"use strict";
// These exercises are real standalone scripts, run with real `node`. Most of
// them define a function the grader must call with its own hidden inputs --
// the instructions explicitly warn students to comment out their own test
// calls, implying exactly that. We do this by appending marked calls to the
// student's source and running the combined file once, rather than eval'ing
// their function in isolation, so their code runs exactly as node would run
// it (their own top-level code included).

const fs = require("fs");

function shQuote(s) {
  return "'" + String(s).replace(/'/g, `'\\''`) + "'";
}

function runScript(g, file, { timeout = 5000, args = [] } = {}) {
  const cmd = ["node", shQuote(file), ...args.map(shQuote)].join(" ");
  const { code, stdout, stderr } = g.sh(cmd, { timeout });
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

const MARKER = "__GANDALF__";

/**
 * Appends marked calls to `funcName` (one per entry in `cases`, each
 * `{ args: [...] }`) after the student's own source, then runs the combined
 * file once with real node. Each call is individually try/caught so one
 * throwing case doesn't prevent the others from running.
 *
 * Returns `{ missing: true }` if the file doesn't exist, otherwise
 * `{ missing: false, result, outcomes }` where `outcomes[i]` is one of:
 *   { found: false }                        -- never reached (earlier crash)
 *   { found: true, threw: true, message }   -- the call itself threw
 *   { found: true, parseError: true, raw }  -- printed something we couldn't parse
 *   { found: true, value }                  -- the actual return value
 */
function runFunctionTests(g, file, funcName, cases, { timeout = 5000 } = {}) {
  if (!g.isFile(file)) return { missing: true };

  const source = g.readText(file);
  const harness = cases
    .map((c, i) => {
      const argsSrc = c.args.map((a) => JSON.stringify(a)).join(", ");
      const tag = JSON.stringify(MARKER + i + "__");
      const errTag = JSON.stringify(MARKER + i + "__ERROR__");
      return (
        `try { var __r = ${funcName}(${argsSrc}); ` +
        // JSON.stringify turns NaN/Infinity into "null", silently lying about
        // what the function actually returned -- keep them as their real
        // string form instead.
        `var __s = (typeof __r === "number" && !isFinite(__r)) ? String(__r) : JSON.stringify(__r); ` +
        `console.log(${tag} + __s); } ` +
        `catch (e) { console.log(${errTag} + e.message); }`
      );
    })
    .join("\n");

  const harnessFile = "__gandalf_harness__" + file;
  fs.writeFileSync(g.path(harnessFile), source + "\n\n// --- gandalf test harness ---\n" + harness + "\n");

  const result = runScript(g, harnessFile, { timeout });
  const outcomes = cases.map((c, i) => {
    const re = new RegExp("^" + MARKER + i + "__(.*)$", "m");
    const m = re.exec(result.stdout);
    if (!m) return { found: false };
    if (m[1].startsWith("ERROR__")) return { found: true, threw: true, message: m[1].slice("ERROR__".length) };
    if (m[1] === "NaN" || m[1] === "Infinity" || m[1] === "-Infinity") {
      return { found: true, value: Number(m[1]) };
    }
    try {
      return { found: true, value: JSON.parse(m[1]) };
    } catch {
      return { found: true, parseError: true, raw: m[1] };
    }
  });

  return { missing: false, result, outcomes };
}

/**
 * Like runFunctionTests, but for functions graded on what they print rather
 * than what they return: wraps each call between start/end markers and
 * captures everything the function itself printed in between.
 */
function runPrintFunctionTests(g, file, funcName, cases, { timeout = 5000 } = {}) {
  if (!g.isFile(file)) return { missing: true };

  const source = g.readText(file);
  const harness = cases
    .map((c, i) => {
      const argsSrc = c.args.map((a) => JSON.stringify(a)).join(", ");
      const start = JSON.stringify(MARKER + "START" + i + "__");
      const err = JSON.stringify(MARKER + "ERR" + i + "__");
      const end = JSON.stringify(MARKER + "END" + i + "__");
      return (
        `console.log(${start});\n` +
        `try { ${funcName}(${argsSrc}); } catch (e) { console.log(${err} + e.message); }\n` +
        `console.log(${end});`
      );
    })
    .join("\n");

  const harnessFile = "__gandalf_print_harness__" + file;
  fs.writeFileSync(g.path(harnessFile), source + "\n\n// --- gandalf test harness ---\n" + harness + "\n");

  const result = runScript(g, harnessFile, { timeout });
  const outcomes = cases.map((c, i) => {
    const startTag = MARKER + "START" + i + "__";
    const endTag = MARKER + "END" + i + "__";
    const errTag = MARKER + "ERR" + i + "__";
    const startIdx = result.stdout.indexOf(startTag);
    const endIdx = result.stdout.indexOf(endTag);
    if (startIdx === -1 || endIdx === -1) return { found: false };

    let block = result.stdout.slice(startIdx + startTag.length, endIdx).replace(/^\n/, "");
    const errIdx = block.indexOf(errTag);
    if (errIdx !== -1) {
      return { found: true, threw: true, message: block.slice(errIdx + errTag.length).split("\n")[0] };
    }
    return { found: true, printed: block };
  });

  return { missing: false, result, outcomes };
}

function argsRepr(args) {
  return args.map((a) => JSON.stringify(a)).join(", ");
}

/**
 * Builds an exercise's `run(g)` for the common shape: a function that takes
 * some args and returns a value, graded against several hidden cases.
 */
function makeFunctionSuite({ file, func, cases, timeout }) {
  return function run(g) {
    const { missing, result, outcomes } = runFunctionTests(g, file, func, cases, { timeout });
    const label = (c) => `${func}(${argsRepr(c.args)}) === ${JSON.stringify(c.expect)}`;

    if (missing) {
      for (const c of cases) g.check(label(c), false, g.exists(file) ? "" : "no such file in this directory");
      return;
    }
    if (result.timedOut) {
      for (const c of cases) g.check(label(c), false, "the script didn't finish in time");
      return;
    }
    if (result.code !== 0 && outcomes.every((o) => !o.found)) {
      const detail = `node exited with ${result.code}: ${firstErrorLine(result.stderr)}`;
      for (const c of cases) g.check(label(c), false, detail);
      return;
    }

    cases.forEach((c, i) => {
      const o = outcomes[i];
      if (!o.found) {
        g.check(label(c), false, "no output for this case (a call before it likely crashed the script)");
      } else if (o.threw) {
        g.check(label(c), false, `threw: ${o.message}`);
      } else if (o.parseError) {
        g.check(label(c), false, `unexpected output: ${o.raw}`);
      } else {
        const ok = JSON.stringify(o.value) === JSON.stringify(c.expect);
        g.check(label(c), ok, ok ? "" : `got ${JSON.stringify(o.value)}`);
      }
    });
  };
}

module.exports = {
  runScript, outputMatches, firstErrorLine, runFunctionTests, runPrintFunctionTests, argsRepr, makeFunctionSuite,
};
