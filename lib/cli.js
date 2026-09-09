"use strict";

const os = require("os");
const path = require("path");
const fs = require("fs");

const VERSION = require("../package.json").version + "-local";
const color = require("./color");
const banner = require("./banner");
const { detect } = require("./context");
const { loadQuests } = require("./registry");
const { render, renderTestCase, renderNamedCheck } = require("./report");
const { grade } = require("./runner");

const ROOT = path.dirname(__dirname);

function userName() {
  return process.env.GANDALF_USER || os.userInfo().username;
}

function bootBanner() {
  banner.printBanner();
  console.log(`Booting Gandalf v${VERSION} (offline)`);
  console.log(`Loading parameters:  ${color.green("OK")}`);
  console.log(`User ${userName()} connection: ${color.green("OK")}`);
}

/** Prints one <TITLE> block. Returns true when the exercise fully passes. */
async function runExercise(exercise, questPath, verbose) {
  const exercisePath = path.join(questPath, exercise.dir);
  console.log(`\n\n<${exercise.title}>`);

  if (!fs.existsSync(exercisePath)) {
    console.log(`Directory ${exercise.dir} exists: ${color.red("KO")}`);
    console.log("Printing your report:\n");
    console.log(render(exercise.title, "FAILURE", 0, 0, exercise.points));
    console.log(`\n</${exercise.title}>`);
    return false;
  }

  console.log(`Directory ${exercise.dir} exists: ${color.green("OK")}`);
  if (exercise.rspec) console.log("RSPEC Detected");
  console.log(`Pushing exercise: ${color.green("OK")}`);
  console.log("Printing your report:\n");

  let grader, runtime;
  try {
    ({ grader, runtime } = await grade(exercise, exercisePath));
  } catch (err) {
    console.log(render(exercise.title, "ERROR", 0, 0, exercise.points));
    console.log(`\n  !! test module failed: ${err.message}\n`);
    console.log(`</${exercise.title}>`);
    return false;
  }

  const status = grader.passed === grader.total ? "SUCCESS" : "FAILURE";
  console.log(render(exercise.title, status, runtime, grader.passed, grader.total));
  console.log("");

  if (grader.testCases.length) {
    console.log("Checks detail Report:");
    for (const tc of grader.testCases) {
      console.log("");
      console.log(renderTestCase(tc));
      console.log("");
    }
  } else if (exercise.rspec) {
    console.log("Checks detail Report:\n");
    for (const c of grader.checks) {
      console.log("");
      console.log(renderNamedCheck(c.label, c.ok));
      if (!c.ok && c.detail) console.log(`  ${color.red("->")} ${c.detail}`);
      console.log("");
    }
    for (const n of grader.notes) console.log(`  ..  ${n}`);
    if (grader.notes.length) console.log("");
  } else {
    for (const c of grader.checks) {
      if (!c.ok) {
        console.log(`  ${color.red("KO")}  ${c.label}${c.detail ? " -- " + c.detail : ""}`);
      } else if (verbose) {
        console.log(`  ${color.green("OK")}  ${c.label}`);
      }
    }
    for (const n of grader.notes) console.log(`  ..  ${n}`);
    if (grader.failures.length || grader.notes.length || verbose) console.log("");
  }

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
  const args = { exercise: null, list: false, verbose: false, version: false, color: null };
  for (const a of argv) {
    if (a === "-l" || a === "--list") args.list = true;
    else if (a === "-v" || a === "--verbose") args.verbose = true;
    else if (a === "-V" || a === "--version") args.version = true;
    else if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--no-color") args.color = false;
    else if (a === "--color") args.color = true;
    else if (!a.startsWith("-")) args.exercise = a;
  }
  return args;
}

function printHelp() {
  console.log(
    [
      "usage: gandalf [exercise] [-v] [-l] [-V] [--color|--no-color]",
      "",
      "  exercise      grade only this exercise (e.g. ex02)",
      "  -v, --verbose also print the checks that passed",
      "  -l, --list    list installed quests and exit",
      "  -V, --version print version and exit",
      "  --color       force colored output even when not a TTY",
      "  --no-color    disable colored output (same as NO_COLOR=1)",
    ].join("\n")
  );
}

async function main(argv) {
  const args = parseArgs(argv);

  if (args.color !== null) color.setEnabled(args.color);

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
    ok = (await runExercise(exercise, context.questPath, args.verbose)) && ok;
  }
  return ok ? 0 : 1;
}

module.exports = { main: (argv) => main(argv).then((code) => process.exit(code)) };
