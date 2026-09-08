# gandalf_preseason

An offline clone of Qwasar's `gandalf` command. Same output format, same
`cd`-and-run workflow, no editor and no network required.

```
preseason/                  <- your parent directory, any name
├── gandalf_preseason/      <- this repo
├── quest00/
│   ├── ex00/ ex01/ ex02/ ex03/ ex04/
├── js-quest01/
└── ...
```

## Install

```bash
cd preseason
git clone <your-fork-url> gandalf_preseason
./gandalf_preseason/install.sh
```

The installer symlinks `bin/gandalf` into `~/.local/bin` and tells you what to
add to your `~/.zshrc` if that directory is not on your `PATH` yet. Only
Python 3.6+ is required, no packages to install.

Prefer not to touch your `PATH`? Add an alias instead:

```bash
alias gandalf="$HOME/preseason/gandalf_preseason/bin/gandalf"
```

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
  KO  my_first_file_with_content size is 40 -- size is 10
  ..  file is not tracked by git yet: git add file && git commit -m '...'
```

Lines starting with `..` are advisory and cost no points.

## Safety

Every exercise is copied into a temporary directory before any check runs.
Tests never read or write your actual exercise directory, so a test that
extracts a tarball or runs a command cannot damage your work. The only
exception is the git advisory in `ex03`, which runs read-only `git` commands
(`ls-files`, `status`) against the real directory.

## Adding a quest

One directory per quest under `quests/`:

```
quests/quest00/
├── quest.json
├── ex00.py
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

Aliases are compared case-insensitively with dashes and underscores removed, so
`js-quest01`, `js_quest01` and `JSQuest01` all resolve to the same quest. Add an
alias whenever a clone is named differently from the quest.

Each exercise is a module exposing `run(g)`, where `g` is the grader. Call
`g.check(label, ok, detail)` exactly `points` times, on every code path,
including the ones that bail out early:

```python
FILE = "my_first_file"

def run(g):
    g.check("%s exists" % FILE, g.is_file(FILE), "no such file here")
```

Grader API: `g.check`, `g.note`, `g.path`, `g.exists`, `g.is_file`, `g.size`,
`g.mode` (as `-rw-r--r--`), `g.read_bytes`, `g.sh` (returns `rc, stdout, stderr`,
runs inside the sandbox), `g.sandbox`, `g.origin`.

Then verify the point counts line up:

```bash
python3 tools/selftest.py
```

It runs every module against an empty directory and complains if a module
reports a different number of checks than it declares, which would make the
maximum score jump around between runs.

## Quests covered

- **quest00** — ex00 to ex04
