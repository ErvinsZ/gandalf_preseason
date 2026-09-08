"use strict";
// `cat my_z` must print Z followed by a newline. 2 points.

const FILE = "my_z";
const WANTED = "Z\n";

exports.run = function (g) {
  const exists = g.check(
    `${FILE} exists`,
    g.exists(FILE),
    g.exists(FILE) ? "" : "no such file in this directory"
  );

  if (!exists) {
    g.check(`cat ${FILE} prints Z`, false, "nothing to cat");
    return;
  }

  const { code, stdout, stderr } = g.sh(`cat ${FILE}`);
  const out = stdout.toString();
  const ok = code === 0 && out === WANTED;
  const detail =
    code !== 0
      ? `cat exited with ${code}: ${stderr.toString().trim()}`
      : ok
      ? ""
      : `got ${JSON.stringify(out)}, expected ${JSON.stringify(WANTED)}`;
  g.check(`cat ${FILE} prints Z`, ok, detail);
};
