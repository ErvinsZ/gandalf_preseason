"""ex02 - a tarball holding a 40 byte file with permissions r--r-xr-x. 6 points.

The submitted file is the tarball, so every check reads the archive's metadata.
If the tarball is missing we fall back to the loose file on disk: the first
check still fails, but the student gets real feedback on the other five.
"""

import stat
import tarfile

FILE = "my_first_file_with_content_and_perms"
TAR = FILE + ".tar"
WANTED_MODE = "-r--r-xr-x"


def _entry(g):
    """Return (source_label, size, filemode_string, is_regular) or None."""
    tar_path = g.path(TAR)
    try:
        with tarfile.open(tar_path) as archive:
            for member in archive.getmembers():
                if member.name.lstrip("./") == FILE:
                    return ("archive", member.size,
                            stat.filemode(stat.S_IFREG | member.mode),
                            member.isfile())
            return ("archive", None, None, None)
    except (IOError, OSError, tarfile.TarError):
        pass

    if g.exists(FILE):
        return ("directory", g.size(FILE), g.mode(FILE), g.is_file(FILE))
    return None


def run(g):
    g.check("%s exists" % TAR,
            g.is_file(TAR),
            "run: tar -cf %s %s" % (TAR, FILE))

    readable = False
    detail = ""
    try:
        with tarfile.open(g.path(TAR)):
            readable = True
    except (IOError, OSError):
        detail = "the archive is missing"
    except tarfile.TarError as exc:
        detail = "not a valid tar archive (%s)" % exc
    g.check("%s is a readable tar archive" % TAR, readable, detail)

    found = _entry(g)
    if found and found[0] == "directory":
        g.note("no usable tarball, so the loose file was graded instead; "
               "remember Part 01: tar -cf %s %s" % (TAR, FILE))
    if found is None:
        for label in ("archive contains %s" % FILE,
                      "%s is a regular file" % FILE,
                      "%s size is 40" % FILE,
                      "%s permissions are %s" % (FILE, WANTED_MODE)):
            g.check(label, False, "nothing to inspect")
        return

    source, size, mode, is_regular = found
    hint = "" if source == "archive" else "(checked the loose file, not the tar)"

    g.check("archive contains %s" % FILE, size is not None,
            "archive has no entry named %s" % FILE if size is None else hint)
    g.check("%s is a regular file" % FILE, bool(is_regular), hint)
    g.check("%s size is 40" % FILE, size == 40,
            ("size is %s" % ("unknown" if size is None else size)) if size != 40 else hint)
    g.check("%s permissions are %s" % (FILE, WANTED_MODE), mode == WANTED_MODE,
            ("permissions are %s, try chmod 455" % (mode or "unknown"))
            if mode != WANTED_MODE else hint)
