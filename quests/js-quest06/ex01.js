"use strict";
// my_upcase(str): uppercased string. 3 points -- the 2 given examples plus
// one hidden case mixing letters, punctuation, and digits.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_upcase.js",
  func: "my_upcase",
  cases: [
    { args: ["aBc"], expect: "ABC" },
    { args: [""], expect: "" },
    { args: ["Hello World! 123"], expect: "HELLO WORLD! 123" },
  ],
});
