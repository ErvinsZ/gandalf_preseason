"use strict";
// my_sub(a, b): a - b. 5 points -- the 3 given examples plus 2 extra hidden
// cases.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_sub.js",
  func: "my_sub",
  cases: [
    { args: [0, 1], expect: -1 },
    { args: [10, 10], expect: 0 },
    { args: [-10, 10], expect: -20 },
    { args: [7, 3], expect: 4 },
    { args: [100, -1], expect: 101 },
  ],
});
