"use strict";

// Mirrors Python's stat.filemode(), but only for the file types we ever meet
// in these exercises (regular file, directory, symlink).
const S_IFMT = 0o170000;
const S_IFLNK = 0o120000;
const S_IFDIR = 0o040000;

const BITS = [
  [0o400, "r"], [0o200, "w"], [0o100, "x"],
  [0o040, "r"], [0o020, "w"], [0o010, "x"],
  [0o004, "r"], [0o002, "w"], [0o001, "x"],
];

function permBits(mode) {
  let s = "";
  for (const [bit, ch] of BITS) s += (mode & bit) ? ch : "-";
  return s;
}

/** mode: a full st_mode-style integer (type bits + permission bits). */
function filemode(mode) {
  const type = mode & S_IFMT;
  const prefix = type === S_IFDIR ? "d" : type === S_IFLNK ? "l" : "-";
  return prefix + permBits(mode & 0o777);
}

module.exports = { filemode, permBits };
