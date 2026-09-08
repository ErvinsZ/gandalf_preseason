"use strict";
// A file named `file` holding the word content. 2 points.
//
// The real gandalf grades what was pushed, so committing is implicit. Offline
// we grade the working tree and add an advisory when the file isn't tracked
// by git yet, which is the part students actually forget.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const FILE = "file";
const WANTED = "content\n";

function git(origin, ...args) {
  const result = spawnSync("git", args, { cwd: origin, timeout: 10000 });
  return { code: result.status === null ? 1 : result.status, stdout: (result.stdout || Buffer.alloc(0)).toString() };
}

exports.run = function (g) {
  const exists = g.check(
    `${FILE} exists and is a regular file`,
    g.isFile(FILE),
    g.exists(FILE) ? "" : "no such file in this directory"
  );

  const data = exists ? g.readText(FILE) : null;
  const ok = data === WANTED || data === "content";
  g.check(
    `${FILE} contains "content"`,
    ok,
    ok ? "" : `got ${JSON.stringify(data)}, expected ${JSON.stringify(WANTED)}`
  );

  if (!exists) return;

  if (!fs.existsSync(path.join(g.origin, ".git")) && git(g.origin, "rev-parse", "--git-dir").code !== 0) {
    g.note("this directory is not inside a git repository");
    return;
  }

  if (git(g.origin, "ls-files", "--error-unmatch", FILE).code !== 0) {
    g.note(`${FILE} is not tracked by git yet: git add ${FILE} && git commit -m '...' && git push`);
    return;
  }

  const status = git(g.origin, "status", "--porcelain", "--", FILE);
  if (status.code === 0 && status.stdout.trim()) {
    g.note(`${FILE} has uncommitted changes: commit and push them`);
  }
};
