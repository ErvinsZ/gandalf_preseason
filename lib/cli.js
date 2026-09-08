"use strict";

const os = require("os");
const path = require("path");
const fs = require("fs");

const VERSION = require("../package.json").version + "-local";
const { detect } = require("./context");
const { loadQuests } = require("./registry");
const { render } = require("./report");
const { grade } = require("./runner");

const ROOT = path.dirname(__dirname);

function userName() {
  return process.env.GANDALF_USER || os.userInfo().username;
}

function bootBanner() {
  console.log(`Booting Gandalf v${VERSION} (offline)`);
  console.log("Loading parameters:  OK");
  console.log(`User ${userName()} connection: OK`);
}

/** Prints one <TITLE> block. Returns true when the exercise fully passes. */
function runExercise(exercise, questPath, verbose) {
  const exercisePath = path.join(questPath, exercise.dir);
  console.log(`\n\n<${exercise.title}>`);

  if (!fs.existsSync(exercisePath)) {
    console.log(`Directory ${exercise.dir} exists: KO`);
    console.log("Printing your report:\n");
    console.log(render(exercise.title, "FAILURE", 0, 0, exercise.points));
    console.log(`\n</${exercise.title}>`);
    return false;
  }

  console.log(`Directory ${exercise.dir} exists: OK`);
  console.log("Pushing exercise: OK");
  console.log("Printing your report:\n");

  let grader, runtime;
  try {
    ({ grader, runtime } = grade(exercise, exercisePath));
  } catch (err) {
    console.log(render(exercise.title, "ERROR", 0, 0, exercise.points));
    console.log(`\n  !! test module failed: ${err.message}\n`);
    console.log(`</${exercise.title}>`);
    return false;
  }

  const status = grader.passed === grader.total ? "SUCCESS" : "FAILURE";
  console.log(render(exercise.title, status, runtime, grader.passed, grader.total));
  console.log("");

  for (const c of grader.checks) {
    if (!c.ok) {
      console.log(`  KO  ${c.label}${c.detail ? " -- " + c.detail : ""}`);
    } else if (verbose) {
      console.log(`  OK  ${c.label}`);
    }
  }
  for (const n of grader.notes) console.log(`  ..  ${n}`);
  if (grader.failures.length || grader.notes.length || verbose) console.log("");

  console.log(`</${exercise.title}>`);
  return grader.passed === grader.total;
}

function cmdList(quests) {
  if (!quests.length) {
    console.log(`No quests installed in ${path.join(ROOT, "quests")}`);
    return 1;
  }
  for (const quest of quests) {
    console.log(`${quest.name}  (${quest.description || "no description"})`);
    for (const ex of quest.exercises) {
      console.log(`    ${ex.dir.padEnd(6)} ${ex.title.padEnd(40)} ${ex.points} pt`);
    }
  }
  return 0;
}

function parseArgs(argv) {
  const args = { exercise: null, list: false, verbose: false, version: false };
  for (const a of argv) {
    if (a === "-l" || a === "--list") args.list = true;
    else if (a === "-v" || a === "--verbose") args.verbose = true;
    else if (a === "-V" || a === "--version") args.version = true;
    else if (a === "-h" || a === "--help") args.help = true;
    else if (!a.startsWith("-")) args.exercise = a;
  }
  return args;
}

function printHelp() {
  console.log(
    [
      "usage: gandalf [exercise] [-v] [-l] [-V]",
      "",
      "  exercise      grade only this exercise (e.g. ex02)",
      "  -v, --verbose also print the checks that passed",
      "  -l, --list    list installed quests and exit",
      "  -V, --version print version and exit",
    ].join("\n")
  );
}

function main(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return 0;
  }
  if (args.version) {
    console.log(`gandalf ${VERSION}`);
    return 0;
  }

  const quests = loadQuests(ROOT);

  if (args.list) return cmdList(quests);

  const context = detect(process.cwd(), quests);
  if (context === null) {
    process.stderr.write(
      "gandalf: no quest here.\n" +
        "         cd into a quest directory (quest00, js-quest01, ...) or\n" +
        "         into one of its exercise directories, then run gandalf.\n" +
        "         `gandalf --list` shows what is installed.\n"
    );
    return 2;
  }

  let exercises = context.exercises;
  if (args.exercise) {
    const wanted = args.exercise.replace(/\/+$/, "").toLowerCase();
    exercises = context.quest.exercises.filter((e) => e.dir === wanted);
    if (!exercises.length) {
      process.stderr.write(`gandalf: ${context.quest.name} has no exercise '${args.exercise}'\n`);
      return 2;
    }
  }

  bootBanner();

  let ok = true;
  for (const exercise of exercises) {
    ok = runExercise(exercise, context.questPath, args.verbose) && ok;
  }
  return ok ? 0 : 1;
}

module.exports = { main: (argv) => process.exit(main(argv)) };
