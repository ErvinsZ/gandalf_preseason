"use strict";
// Minimal reader for uncompressed ustar tarballs (what `tar -cf` produces).
// We only need one member's metadata, not extraction, so this stays small.

const fs = require("fs");

function octal(buf) {
  const s = buf.toString("ascii").replace(/\0.*$/s, "").trim();
  return s ? parseInt(s, 8) : 0;
}

const S_IFREG = 0o100000;

/**
 * Returns { size, mode, isFile } for the first entry whose name matches
 * (leading "./" ignored), or null if the archive can't be read or the
 * member isn't in it.
 */
function findMember(tarPath, wantedName) {
  let buf;
  try {
    buf = fs.readFileSync(tarPath);
  } catch {
    return { error: "missing" };
  }

  if (buf.length < 512 || buf.length % 512 !== 0) {
    return { error: "not a tar archive" };
  }

  let offset = 0;
  let sawAnyHeader = false;
  while (offset + 512 <= buf.length) {
    const header = buf.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break; // end-of-archive marker

    const magic = header.subarray(257, 263).toString("ascii");
    if (!magic.startsWith("ustar")) {
      return sawAnyHeader ? { error: "not a tar archive" } : { error: "not a tar archive" };
    }
    sawAnyHeader = true;

    let name = header.subarray(0, 100).toString("ascii").replace(/\0.*$/s, "");
    const prefix = header.subarray(345, 500).toString("ascii").replace(/\0.*$/s, "");
    if (prefix) name = prefix + "/" + name;
    name = name.replace(/^\.\//, "");

    const mode = octal(header.subarray(100, 108));
    const size = octal(header.subarray(124, 136));
    const typeflag = header.subarray(156, 157).toString("ascii");
    const isFile = typeflag === "0" || typeflag === "\0" || typeflag === "";

    if (name === wantedName) {
      return { size, mode: S_IFREG | (mode & 0o7777), isFile };
    }

    offset += 512 + Math.ceil(size / 512) * 512;
  }

  return sawAnyHeader ? { error: "not found" } : { error: "not a tar archive" };
}

module.exports = { findMember };
