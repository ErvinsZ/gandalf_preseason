"use strict";
// my_add(a, b): a + b. 5 points -- the 3 given examples plus 2 extra hidden
// cases.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_add.js",
  func: "my_add",
  cases: [
    { args: [0, 1], expect: 1 },
    { args: [10, 10], expect: 20 },
    { args: [-10, 10], expect: 0 },
    { args: [5, 5], expect: 10 },
    { args: [-100, 1], expect: -99 },
  ],
});
