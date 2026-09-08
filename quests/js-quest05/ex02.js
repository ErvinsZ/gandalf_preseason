"use strict";
// my_abs(n): the positive value of n. 4 points -- the 3 given examples plus
// one extra hidden case.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_abs.js",
  func: "my_abs",
  cases: [
    { args: [-30], expect: 30 },
    { args: [30], expect: 30 },
    { args: [0], expect: 0 },
    { args: [-1], expect: 1 },
  ],
});
