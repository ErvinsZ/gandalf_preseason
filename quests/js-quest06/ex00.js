"use strict";
// my_string_index(haystack, needle): index of the first occurrence of needle
// in haystack, or -1. 2 points, matching the 2 given examples.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_string_index.js",
  func: "my_string_index",
  cases: [
    { args: ["hello", "l"], expect: 2 },
    { args: ["aaaaa", "b"], expect: -1 },
  ],
});
