#!/usr/bin/env node
"use strict";

// Runs every exercise module against an empty directory and asserts it
// produced exactly `points` checks, all failing. A module that short-circuits
// and forgets to report the remaining checks would otherwise silently change
// the maximum score between runs.
//
//   node tools/selftest.js

const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.dirname(__dirname);
const { loadQuests } = require("../lib/registry");
const { grade } = require("../lib/runner");

function main() {
  let failures = 0;

  for (const quest of loadQuests(ROOT)) {
    console.log(quest.name);
    for (const ex of quest.exercises) {
      const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "gandalf-selftest-"));
      const target = path.join(emptyRoot, ex.dir);
      fs.mkdirSync(target);

      let grader;
      try {
        ({ grader } = grade(ex, target));
      } catch (err) {
        console.log(`    ${ex.dir.padEnd(6)} EXPLODED: ${err.message}`);
        failures++;
        fs.rmSync(emptyRoot, { recursive: true, force: true });
        continue;
      }
      fs.rmSync(emptyRoot, { recursive: true, force: true });

      const problems = [];
      if (grader.total !== ex.points) {
        problems.push(`declares ${ex.points} points but ran ${grader.total} checks`);
      }
      if (grader.passed) {
        problems.push(`${grader.passed} checks passed on an empty directory`);
      }

      if (problems.length) {
        console.log(`    ${ex.dir.padEnd(6)} FAIL: ${problems.join("; ")}`);
        failures++;
      } else {
        console.log(`    ${ex.dir.padEnd(6)} ok (${grader.total} checks)`);
      }
    }
  }

  console.log("");
  console.log(failures ? `FAILED (${failures})` : "All good.");
  return failures ? 1 : 0;
}

process.exit(main());
