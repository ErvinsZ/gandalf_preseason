"""ex04 - `cat my_z` must print Z followed by a newline. 2 points."""

FILE = "my_z"
WANTED = b"Z\n"


def run(g):
    exists = g.check("%s exists" % FILE,
                     g.exists(FILE),
                     "" if g.exists(FILE) else "no such file in this directory")

    if not exists:
        g.check("cat %s prints Z" % FILE, False, "nothing to cat")
        return

    code, out, err = g.sh("cat %s" % FILE)
    ok = code == 0 and out == WANTED
    if code != 0:
        detail = "cat exited with %d: %s" % (code, err.decode("utf-8", "replace").strip())
    else:
        detail = "" if ok else "got %r, expected %r" % (out, WANTED)
    g.check("cat %s prints Z" % FILE, ok, detail)
