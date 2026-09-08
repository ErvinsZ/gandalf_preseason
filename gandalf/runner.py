"""Sandboxing and grading of a single exercise.

Every exercise is copied (permissions and symlinks preserved) into a temporary
directory before any check runs, so a test can extract a tarball or delete a
file without ever touching the student's work.
"""

import importlib.util
import os
import shutil
import stat
import subprocess
import sys
import tempfile
import time


class Check(object):
    def __init__(self, label, ok, detail=""):
        self.label = label
        self.ok = ok
        self.detail = detail


class Grader(object):
    """Handed to every exercise module's `run()`."""

    def __init__(self, sandbox, origin):
        self.sandbox = sandbox    # temp copy, safe to mutate
        self.origin = origin      # real exercise dir, read only
        self.checks = []
        self.notes = []

    # --- assertions ------------------------------------------------------
    def check(self, label, ok, detail=""):
        self.checks.append(Check(label, bool(ok), detail))
        return bool(ok)

    def note(self, message):
        """Advisory line, not worth any point."""
        self.notes.append(message)

    # --- filesystem helpers ---------------------------------------------
    def path(self, *parts):
        return os.path.join(self.sandbox, *parts)

    def exists(self, name):
        return os.path.lexists(self.path(name))

    def is_file(self, name):
        return os.path.isfile(self.path(name))

    def size(self, name):
        try:
            return os.stat(self.path(name)).st_size
        except OSError:
            return None

    def mode(self, name):
        try:
            return stat.filemode(os.lstat(self.path(name)).st_mode)
        except OSError:
            return None

    def read_bytes(self, name):
        try:
            with open(self.path(name), "rb") as fh:
                return fh.read()
        except (OSError, IOError):
            return None

    def sh(self, command, timeout=10):
        """Run a shell command inside the sandbox. Returns (rc, stdout, stderr)."""
        try:
            proc = subprocess.run(
                command, shell=True, cwd=self.sandbox, timeout=timeout,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            )
            return proc.returncode, proc.stdout, proc.stderr
        except subprocess.TimeoutExpired:
            return 124, b"", b"timeout"

    # --- scoring ---------------------------------------------------------
    @property
    def passed(self):
        return sum(1 for c in self.checks if c.ok)

    @property
    def total(self):
        return len(self.checks)

    @property
    def failures(self):
        return [c for c in self.checks if not c.ok]


def _force_writable(func, path, _exc):
    try:
        os.chmod(os.path.dirname(path), 0o700)
        os.chmod(path, 0o700)
        func(path)
    except OSError:
        pass


def load_module(exercise):
    spec = importlib.util.spec_from_file_location(
        "gandalf_tests_%s_%s" % (exercise.quest.name, exercise.dir),
        exercise.module_path,
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def grade(exercise, exercise_path):
    """Run one exercise. Returns (grader, runtime_seconds)."""
    sandbox_root = tempfile.mkdtemp(prefix="gandalf-")
    sandbox = os.path.join(sandbox_root, exercise.dir)
    try:
        shutil.copytree(exercise_path, sandbox, symlinks=True)
        os.chmod(sandbox, 0o755)

        module = load_module(exercise)
        grader = Grader(sandbox, exercise_path)

        start = time.perf_counter()
        module.run(grader)
        runtime = time.perf_counter() - start
        return grader, runtime
    finally:
        _rmtree(sandbox_root)


def _rmtree(path):
    if sys.version_info >= (3, 12):
        shutil.rmtree(path, onexc=_force_writable)
    else:
        shutil.rmtree(path, onerror=_force_writable)
