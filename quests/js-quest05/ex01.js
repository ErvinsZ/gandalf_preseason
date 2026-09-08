"use strict";
// my_is_negative(n): 0 if n < 0, else 1. 4 points, one per hidden test case
// (mirroring the four sample calls given in the exercise's own tip, including
// the one students are told to comment out).

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_is_negative.js",
  func: "my_is_negative",
  cases: [
    { args: [-1], expect: 0 },
    { args: [1], expect: 1 },
    { args: [0], expect: 1 },
    { args: [1337], expect: 1 },
  ],
});
