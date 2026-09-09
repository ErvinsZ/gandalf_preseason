"use strict";
// my_array_uniq(arr): duplicates removed, first-occurrence order preserved.
// 3 points, matching the 3 given examples.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_array_uniq.js",
  func: "my_array_uniq",
  cases: [
    { args: [[1, 1, 2]], expect: [1, 2] },
    { args: [[]], expect: [] },
    { args: [[1, 1, 1, 2, 3, 4, 1]], expect: [1, 2, 3, 4] },
  ],
});
