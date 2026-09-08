"""ex01 - my_first_file_with_content must exist and weigh 40 bytes. 2 points."""

FILE = "my_first_file_with_content"


def run(g):
    exists = g.check("%s exists and is a regular file" % FILE,
                     g.is_file(FILE),
                     "" if g.exists(FILE) else "no such file in this directory")

    size = g.size(FILE) if exists else None
    g.check("%s size is 40" % FILE,
            size == 40,
            "" if size == 40 else "size is %s" % ("unknown" if size is None else size))
