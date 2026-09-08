"use strict";
// my_first_file_with_content must exist and weigh 40 bytes. 2 points.

const FILE = "my_first_file_with_content";

exports.run = function (g) {
  const exists = g.check(
    `${FILE} exists and is a regular file`,
    g.isFile(FILE),
    g.exists(FILE) ? "" : "no such file in this directory"
  );

  const size = exists ? g.size(FILE) : null;
  g.check(
    `${FILE} size is 40`,
    size === 40,
    size === 40 ? "" : `size is ${size === null ? "unknown" : size}`
  );
};
