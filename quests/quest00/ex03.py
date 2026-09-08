"""ex03 - a file named `file` holding the word content. 2 points.

The real gandalf grades what was pushed, so committing is implicit. Offline we
grade the working tree and add an advisory line when the file is not tracked by
git yet, which is the part students actually forget.
"""

import os
import subprocess

FILE = "file"
WANTED = b"content\n"


def _git(origin, *args):
    try:
        proc = subprocess.run(("git",) + args, cwd=origin, timeout=10,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return proc.returncode, proc.stdout
    except (OSError, subprocess.TimeoutExpired):
        return 1, b""


def run(g):
    exists = g.check("%s exists and is a regular file" % FILE,
                     g.is_file(FILE),
                     "" if g.exists(FILE) else "no such file in this directory")

    data = g.read_bytes(FILE) if exists else None
    ok = data in (WANTED, b"content")
    g.check('%s contains "content"' % FILE, ok,
            "" if ok else "got %r, expected %r" % (data, WANTED))

    if not exists:
        return

    if not os.path.isdir(os.path.join(g.origin, ".git")) and \
            _git(g.origin, "rev-parse", "--git-dir")[0] != 0:
        g.note("this directory is not inside a git repository")
        return

    code, _ = _git(g.origin, "ls-files", "--error-unmatch", FILE)
    if code != 0:
        g.note("%s is not tracked by git yet: git add %s && git commit -m '...' && git push"
               % (FILE, FILE))
        return

    code, out = _git(g.origin, "status", "--porcelain", "--", FILE)
    if code == 0 and out.strip():
        g.note("%s has uncommitted changes: commit and push them" % FILE)
