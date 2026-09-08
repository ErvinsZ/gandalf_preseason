"use strict";
// my_first_file must simply exist. 1 point.

const FILE = "my_first_file";

exports.run = function (g) {
  g.check(
    `${FILE} exists and is a regular file`,
    g.isFile(FILE),
    g.exists(FILE) ? "" : "no such file in this directory"
  );
};
