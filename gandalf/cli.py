import argparse
import getpass
import os
import sys

from . import VERSION
from .context import detect
from .registry import load_quests
from .report import render
from .runner import grade

ROOT = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))


def user_name():
    return os.environ.get("GANDALF_USER") or getpass.getuser()


def boot_banner():
    print("Booting Gandalf v%s (offline)" % VERSION)
    print("Loading parameters:  OK")
    print("User %s connection: OK" % user_name())


def run_exercise(exercise, quest_path, verbose=False):
    """Print one <TITLE> block. Returns True when the exercise fully passes."""
    exercise_path = os.path.join(quest_path, exercise.dir)
    print("\n\n<%s>" % exercise.title)

    if not os.path.isdir(exercise_path):
        print("Directory %s exists: KO" % exercise.dir)
        print("Printing your report:")
        print("")
        print(render(exercise.title, "FAILURE", 0.0, 0, exercise.points))
        print("")
        print("</%s>" % exercise.title)
        return False

    print("Directory %s exists: OK" % exercise.dir)
    print("Pushing exercise: OK")
    print("Printing your report:")
    print("")

    try:
        grader, runtime = grade(exercise, exercise_path)
    except Exception as exc:  # a broken test module should not kill the run
        print(render(exercise.title, "ERROR", 0.0, 0, exercise.points))
        print("")
        print("  !! test module failed: %s" % exc)
        print("")
        print("</%s>" % exercise.title)
        return False

    status = "SUCCESS" if grader.passed == grader.total else "FAILURE"
    print(render(exercise.title, status, runtime, grader.passed, grader.total))
    print("")

    for check in grader.checks:
        if not check.ok:
            line = "  KO  %s" % check.label
            if check.detail:
                line += " -- %s" % check.detail
            print(line)
        elif verbose:
            print("  OK  %s" % check.label)
    for note in grader.notes:
        print("  ..  %s" % note)
    if grader.failures or grader.notes or verbose:
        print("")

    print("</%s>" % exercise.title)
    return grader.passed == grader.total


def cmd_list(quests):
    if not quests:
        print("No quests installed in %s" % os.path.join(ROOT, "quests"))
        return 1
    for quest in quests:
        print("%s  (%s)" % (quest.name, quest.description or "no description"))
        for ex in quest.exercises:
            print("    %-6s %-40s %d pt" % (ex.dir, ex.title, ex.points))
    return 0


def main(argv):
    parser = argparse.ArgumentParser(
        prog="gandalf",
        description="Offline test runner for Qwasar exercises.",
    )
    parser.add_argument("exercise", nargs="?",
                        help="grade only this exercise (e.g. ex02)")
    parser.add_argument("-l", "--list", action="store_true",
                        help="list installed quests and exit")
    parser.add_argument("-v", "--verbose", action="store_true",
                        help="also print the checks that passed")
    parser.add_argument("-V", "--version", action="store_true",
                        help="print version and exit")
    args = parser.parse_args(argv)

    if args.version:
        print("gandalf %s" % VERSION)
        return 0

    quests = load_quests(ROOT)

    if args.list:
        return cmd_list(quests)

    context = detect(os.getcwd(), quests)
    if context is None:
        sys.stderr.write(
            "gandalf: no quest here.\n"
            "         cd into a quest directory (quest00, js-quest01, ...) or\n"
            "         into one of its exercise directories, then run gandalf.\n"
            "         `gandalf --list` shows what is installed.\n"
        )
        return 2

    exercises = context.exercises
    if args.exercise:
        wanted = args.exercise.rstrip("/").lower()
        exercises = [e for e in context.quest.exercises if e.dir == wanted]
        if not exercises:
            sys.stderr.write("gandalf: %s has no exercise '%s'\n"
                             % (context.quest.name, args.exercise))
            return 2

    boot_banner()

    ok = True
    for exercise in exercises:
        ok = run_exercise(exercise, context.quest_path, args.verbose) and ok
    return 0 if ok else 1
