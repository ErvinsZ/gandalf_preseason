"use strict";
// my_map_mult_two(arr): each element multiplied by 2. 3 points -- the 2
// given examples plus one hidden case with negatives and zero.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_map_mult_two.js",
  func: "my_map_mult_two",
  cases: [
    { args: [[1, 2, 3, 4, 5]], expect: [2, 4, 6, 8, 10] },
    { args: [[]], expect: [] },
    { args: [[-3, 0, 10]], expect: [-6, 0, 20] },
  ],
});
