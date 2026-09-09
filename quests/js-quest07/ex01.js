"use strict";
// my_count_on_it(arr): length of each string. 3 points, matching the 3 given
// examples.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_count_on_it.js",
  func: "my_count_on_it",
  cases: [
    { args: [["This", "is", "the", "way"]], expect: [4, 2, 3, 3] },
    { args: [["aBc", "AbcE Fgef1"]], expect: [3, 10] },
    { args: [["aBc"]], expect: [3] },
  ],
});
