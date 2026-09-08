"use strict";
// my_mult(a, b): a * b. 5 points -- the 3 given examples plus 2 extra hidden
// cases.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_mult.js",
  func: "my_mult",
  cases: [
    { args: [0, 1], expect: 0 },
    { args: [10, 10], expect: 100 },
    { args: [-10, 10], expect: -100 },
    { args: [3, 4], expect: 12 },
    { args: [-3, -3], expect: 9 },
  ],
});
