"use strict";
// my_size(str): string length. 3 points, matching the 3 given examples.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_size.js",
  func: "my_size",
  cases: [
    { args: ["aBc"], expect: 3 },
    { args: [""], expect: 0 },
    { args: ["AbcE Fgef1"], expect: 10 },
  ],
});
