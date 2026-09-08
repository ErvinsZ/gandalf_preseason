#!/usr/bin/env python3
"""Sanity check for quest authors.

Runs every exercise module against an empty directory and asserts that the
module produced exactly `points` checks, all failing. A test that short-circuits
and forgets to report the remaining checks would otherwise silently change the
maximum score, e.g. print 0/2 in one case and 0/6 in another.

    python3 tools/selftest.py
"""

import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.insert(0, ROOT)

from gandalf.registry import load_quests  # noqa: E402
from gandalf.runner import grade  # noqa: E402


def main():
    failures = 0
    for quest in load_quests(ROOT):
        print("%s" % quest.name)
        for ex in quest.exercises:
            with tempfile.TemporaryDirectory() as empty:
                target = os.path.join(empty, ex.dir)
                os.mkdir(target)
                try:
                    grader, _ = grade(ex, target)
                except Exception as exc:
                    print("    %-6s EXPLODED: %s" % (ex.dir, exc))
                    failures += 1
                    continue

            problems = []
            if grader.total != ex.points:
                problems.append("declares %d points but ran %d checks"
                                % (ex.points, grader.total))
            if grader.passed:
                problems.append("%d checks passed on an empty directory"
                                % grader.passed)
            if problems:
                print("    %-6s FAIL: %s" % (ex.dir, "; ".join(problems)))
                failures += 1
            else:
                print("    %-6s ok (%d checks)" % (ex.dir, grader.total))

    print("")
    print("FAILED (%d)" % failures if failures else "All good.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
