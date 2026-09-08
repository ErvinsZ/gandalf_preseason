"""ex00 - my_first_file must simply exist. 1 point."""

FILE = "my_first_file"


def run(g):
    g.check("%s exists and is a regular file" % FILE,
            g.is_file(FILE),
            "" if g.exists(FILE) else "no such file in this directory")
