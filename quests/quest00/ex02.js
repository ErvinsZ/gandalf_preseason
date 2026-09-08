"use strict";
// A tarball holding a 40 byte file with permissions r--r-xr-x. 6 points.
//
// The submitted file is the tarball, so every check reads its metadata. If
// the tarball is missing, we fall back to the loose file on disk: the first
// checks still fail, but the student gets real feedback on the rest.

const { findMember } = require("./ustar");
const { filemode } = require("../../lib/filemode");

const FILE = "my_first_file_with_content_and_perms";
const TAR = FILE + ".tar";
const WANTED_MODE = "-r--r-xr-x";

exports.run = function (g) {
  g.check(`${TAR} exists`, g.isFile(TAR), `run: tar -cf ${TAR} ${FILE}`);

  const member = findMember(g.path(TAR), FILE);
  const readable = !member.error || member.error === "not found";
  g.check(
    `${TAR} is a readable tar archive`,
    readable,
    member.error === "missing" ? "the archive is missing" : member.error === "not a tar archive" ? "not a valid tar archive" : ""
  );

  let entry = member.error ? null : member;
  let hint = "";
  if (!entry && g.isFile(FILE)) {
    entry = { size: g.size(FILE), mode: null, isFile: true, loose: true };
    hint = "(checked the loose file, not the tar)";
    g.note(
      `no usable tarball, so the loose file was graded instead; remember Part 01: tar -cf ${TAR} ${FILE}`
    );
  }

  if (!entry) {
    for (const label of [
      `archive contains ${FILE}`,
      `${FILE} is a regular file`,
      `${FILE} size is 40`,
      `${FILE} permissions are ${WANTED_MODE}`,
    ]) {
      g.check(label, false, "nothing to inspect");
    }
    return;
  }

  const modeStr = entry.loose ? filemode(require("fs").statSync(g.path(FILE)).mode) : filemode(entry.mode);

  g.check(`archive contains ${FILE}`, true, hint);
  g.check(`${FILE} is a regular file`, !!entry.isFile, hint);
  g.check(
    `${FILE} size is 40`,
    entry.size === 40,
    entry.size === 40 ? hint : `size is ${entry.size}`
  );
  g.check(
    `${FILE} permissions are ${WANTED_MODE}`,
    modeStr === WANTED_MODE,
    modeStr === WANTED_MODE ? hint : `permissions are ${modeStr}, try chmod 455`
  );
};
