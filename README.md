# gandalf_preseason

An offline clone of Qwasar's `gandalf` command. Same output format, same
`cd`-and-run workflow, no editor and no network required. Runs on Node.js —
no npm packages to install, since Node's built-in `vm` module is enough to
actually execute the JavaScript exercises ask for.

```
preseason/                  <- your parent directory, any name
├── gandalf_preseason/      <- this repo
├── quest00/
│   ├── ex00/ ex01/ ex02/ ex03/ ex04/
├── js-quest01/
└── ...
```

## Install

Requires **Node.js 14+**. Check with `node --version`; if that fails on a
Mac, `xcode-select --install` gets you one, or use `brew install node`.

```bash
cd preseason
git clone <your-fork-url> gandalf_preseason
./gandalf_preseason/install.sh
```

The installer symlinks `bin/gandalf` into `~/.local/bin` and tells you what
to add to `~/.zshrc` if that directory isn't on your `PATH` yet.

Prefer not to touch your `PATH`? Add an alias instead:

```bash
alias gandalf="$HOME/preseason/gandalf_preseason/bin/gandalf"
```

**If `gandalf` runs something unexpected** (wrong banner, wrong error
message) after installing, something else is shadowing it — a leftover shell
function, alias, or another tool of the same name earlier on your `PATH`.
Check with:

```bash
type gandalf        # shows if it's a function/alias and where
which -a gandalf     # lists every match on PATH, in lookup order
```

A shell function or alias always wins over PATH in zsh/bash, so `which` alone
won't show it — `type` will.

## Use

```bash
cd quest00      && gandalf     # grades ex00 through ex04
cd quest00/ex02 && gandalf     # grades ex02 only
cd quest00      && gandalf ex02   # same thing, without moving
```

`gandalf` walks up from wherever you are, so it also works from a subdirectory
of an exercise. Exit status is `0` when everything passes, `1` on a failed
check, `2` when there is no quest to grade.

| flag | effect |
| --- | --- |
| `-v`, `--verbose` | also print the checks that passed |
| `-l`, `--list` | list installed quests and their exercises |
| `-V`, `--version` | print the version |

Set `GANDALF_USER` to change the name in the connection line.

## What it prints

Identical to the real thing when everything passes:

```
Booting Gandalf v4.0.3-local (offline)
Loading parameters:  OK
User zagars_e connection: OK


<MY-FIRST-FILE>
Directory ex00 exists: OK
Pushing exercise: OK
Printing your report:

      REPORT        MY-FIRST-FILE 

 Status             SUCCESS       
 Execution Runtime  0.000065      
 Score              [=] 1/1       

</MY-FIRST-FILE>
```

When a check fails, the score bar shows the misses (`[=-] 1/2`) and the failed
checks are listed underneath the table, which the real gandalf does not do:

```
  KO  age === 34 -- age is "34" (expected the number 34)
  ..  file is not tracked by git yet: git add file && git commit -m '...'
```

Lines starting with `..` are advisory and cost no points.

## How JS/HTML exercises are graded

HTML structure (tags, ids, inline `style=`, `<style>` blocks) is read with a
small regex-based helper in `lib/html.js` — not a full DOM, since that would
mean depending on jsdom. It's deliberately narrow: built for the small,
predictable markup these exercises produce, not arbitrary HTML.

`<script>` contents are executed for real with Node's built-in `vm` module,
in a sandbox that only exposes a `console` capturing `log`/`info` calls. This
means variable checks (`age === 34`) verify the actual value and type, not
just that the right-looking text appears in the source — a script that sets
`age = "34"` (a string) correctly fails. `var`, `let`, and `const` are all
picked up correctly: each `<script>` tag runs as its own top-level script in
one shared `vm` context, which — like separate `<script>` tags in a real
page — keeps `let`/`const` bindings visible to code that runs after them.

For if/else exercises, a script that just prints the "expected" string
regardless of its actual comparison would fool a check that only runs the
example values once. `lib/html.js`'s `overrideAssignment`/`overrideMany` patch
the fixed input variables (e.g. swap `nbr = 10;` for `nbr = 25;`) and re-run
the same script, so the real comparison logic is what gets graded, not a
lucky match with the instructions' example. DOM-manipulation exercises get a
minimal `document.getElementById` stub (`makeDomStub`) rather than a jsdom
dependency, sufficient for `.style.property = value` assignments.

## Safety

Every exercise is copied into a temporary directory before any check runs.
Tests never read or write your actual exercise directory, so a test that
extracts a tarball, runs a shell command, or executes a `<script>` cannot
damage your work. The only exception is the git advisory in quest00's ex03,
which runs read-only `git` commands (`ls-files`, `status`) against the real
directory.

## Adding a quest

One directory per quest under `quests/`:

```
quests/quest00/
├── quest.json
├── ex00.js
└── ...
```

`quest.json` declares how the quest directory is recognized on disk and how
many points each exercise is worth:

```json
{
  "name": "quest00",
  "description": "Shell basics",
  "aliases": ["quest00", "js-quest00"],
  "exercises": [
    {"dir": "ex00", "title": "MY-FIRST-FILE", "points": 1}
  ]
}
```

Aliases are compared case-insensitively with non-alphanumeric characters
stripped, so `js-quest01`, `js_quest01`, and `JSQuest01` all resolve to the
same quest. Add an alias whenever a clone is named differently from the
quest.

Each exercise is a CommonJS module exposing `run(g)`, where `g` is the
grader. Call `g.check(label, ok, detail)` exactly `points` times, on every
code path, including the ones that bail out early:

```javascript
"use strict";
const FILE = "my_first_file";

exports.run = function (g) {
  g.check(`${FILE} exists`, g.isFile(FILE), "no such file here");
};
```

**Grader API** (filesystem): `g.check`, `g.note`, `g.path`, `g.exists`,
`g.isFile`, `g.size`, `g.mode` (returns `-rw-r--r--` style strings),
`g.readBytes`, `g.readText`, `g.sh` (returns `{code, stdout, stderr}`, runs
inside the sandbox), `g.sandbox`, `g.origin`.

**HTML/JS API** (`require("../../lib/html")`): `getTag`, `getTags`,
`getElementById`, `getAttr`, `getRows`, `textContent`, `parseColor`,
`isColor`, `backgroundOf`, `extractScripts`, `runScripts` (executes scripts,
returns `{context, logs, error, getGlobal}`).

Then verify the point counts line up:

```bash
node tools/selftest.js
```

It runs every module against an empty directory and complains if a module
reports a different number of checks than it declares, which would make the
maximum score jump around between runs.

## Quests covered

- **quest00** — ex00 to ex04 (shell basics)
- **js-quest01** — ex00 to ex04 (HTML/CSS/JS basics)
- **js-quest02** — ex00 to ex06 (variables, types, increment, if/else, DOM styling)
- **js-quest03** — ex00 to ex04 (loops, functions, params, return values, DOM positioning)
- **js-quest04** — ex00 to ex03 (standalone Node scripts, single output-match scoring)
- **js-quest05** — ex00 to ex06 (CLI args, functions graded via a hidden-input test harness)
