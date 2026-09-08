"use strict";

function detect() {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR === "0") return false;
  if (process.env.FORCE_COLOR) return true;
  return !!process.stdout.isTTY;
}

let enabled = detect();

function setEnabled(v) {
  enabled = !!v;
}

function wrap(code, s) {
  return enabled ? `\x1b[${code}m${s}\x1b[0m` : s;
}

module.exports = {
  get enabled() {
    return enabled;
  },
  setEnabled,
  green: (s) => wrap("1;32", s),
  red: (s) => wrap("1;31", s),
  // white-on-black badge, like the REPORT label in the real gandalf output
  badge: (s) => wrap("1;37;40", s),
};
