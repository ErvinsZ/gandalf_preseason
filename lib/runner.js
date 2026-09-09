"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");
const { filemode } = require("./filemode");

class Check {
  constructor(label, ok, detail) {
    this.label = label;
    this.ok = !!ok;
    this.detail = detail || "";
  }
}

class Grader {
  constructor(sandbox, origin) {
    this.sandbox = sandbox; // temp copy, safe to mutate
    this.origin = origin; // real exercise dir, read only
    this.checks = [];
    this.notes = [];
    this.testCases = [];
  }

  // --- assertions --------------------------------------------------------
  check(label, ok, detail) {
    ok = !!ok;
    this.checks.push(new Check(label, ok, detail));
    return ok;
  }

  note(message) {
    this.notes.push(message);
  }

  /**
   * Records one test case for the "Checks detail Report" table (used by
   * exercises graded like Qwasar's my_levenshtein_web: several labeled
   * input/output/return-value comparisons per exercise, each shown as its
   * own sub-table). Also feeds the normal pass/fail tally via `check()`, so
   * scoring stays consistent whether or not detail is displayed.
   *
   * `record`: { label, input: [...], expectedOutput, expectedReturn, output,
   *             returnValue, passed, detail }
   */
  testCase(record) {
    this.testCases.push(record);
    return this.check(record.label || `test case ${this.testCases.length - 1}`, record.passed, record.detail);
  }

  // --- filesystem helpers --------------------------------------------------
  path(...parts) {
    return path.join(this.sandbox, ...parts);
  }

  exists(name) {
    try {
      fs.lstatSync(this.path(name));
      return true;
    } catch {
      return false;
    }
  }

  isFile(name) {
    try {
      return fs.statSync(this.path(name)).isFile();
    } catch {
      return false;
    }
  }

  size(name) {
    try {
      return fs.statSync(this.path(name)).size;
    } catch {
      return null;
    }
  }

  /** Permission string like "-r--r-xr-x", following symlinks like `ls -l`. */
  mode(name) {
    try {
      return filemode(fs.statSync(this.path(name)).mode);
    } catch {
      return null;
    }
  }

  readBytes(name) {
    try {
      return fs.readFileSync(this.path(name));
    } catch {
      return null;
    }
  }

  readText(name, encoding = "utf8") {
    const buf = this.readBytes(name);
    return buf === null ? null : buf.toString(encoding);
  }

  sh(command, { timeout = 10000 } = {}) {
    const result = spawnSync("/bin/sh", ["-c", command], {
      cwd: this.sandbox,
      timeout,
    });
    if (result.error && result.error.code === "ETIMEDOUT") {
      return { code: 124, stdout: Buffer.alloc(0), stderr: Buffer.from("timeout") };
    }
    return {
      code: result.status === null ? 1 : result.status,
      stdout: result.stdout || Buffer.alloc(0),
      stderr: result.stderr || Buffer.alloc(0),
    };
  }

  // --- scoring -------------------------------------------------------------
  get passed() {
    return this.checks.filter((c) => c.ok).length;
  }

  get total() {
    return this.checks.length;
  }

  get failures() {
    return this.checks.filter((c) => !c.ok);
  }
}

function copyTree(src, dest) {
  const st = fs.lstatSync(src);
  if (st.isSymbolicLink()) {
    fs.symlinkSync(fs.readlinkSync(src), dest);
  } else if (st.isDirectory()) {
    fs.mkdirSync(dest, { mode: st.mode & 0o777 });
    for (const entry of fs.readdirSync(src)) {
      copyTree(path.join(src, entry), path.join(dest, entry));
    }
    fs.chmodSync(dest, st.mode & 0o777);
  } else if (st.isFile()) {
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, st.mode & 0o777);
  }
}

function rmForce(target) {
  fs.rmSync(target, { recursive: true, force: true, maxRetries: 3 });
}

function loadModule(exercise) {
  // Bypass require's cache so re-running the same exercise in one process
  // (tests, `--list` follow-ups, etc.) always re-reads the file from disk.
  delete require.cache[require.resolve(exercise.modulePath)];
  return require(exercise.modulePath);
}

/** Runs one exercise against a sandboxed copy. Returns { grader, runtime }. */
function grade(exercise, exercisePath) {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gandalf-"));
  let sandbox;
  try {
    if (exercise.dir === ".") {
      // exercisePath IS the exercise root (no exNN subfolder) -- copy its
      // contents directly into sandboxRoot, which mkdtempSync already made.
      sandbox = sandboxRoot;
      for (const entry of fs.readdirSync(exercisePath)) {
        copyTree(path.join(exercisePath, entry), path.join(sandbox, entry));
      }
    } else {
      sandbox = path.join(sandboxRoot, exercise.dir);
      copyTree(exercisePath, sandbox);
    }

    const mod = loadModule(exercise);
    const grader = new Grader(sandbox, exercisePath);

    const start = process.hrtime.bigint();
    mod.run(grader);
    const runtime = Number(process.hrtime.bigint() - start) / 1e9;
    return { grader, runtime };
  } finally {
    rmForce(sandboxRoot);
  }
}

module.exports = { Grader, Check, grade, copyTree, vm };
