"use strict";
// my_downcase(str): lowercased string. 3 points -- the 2 given examples plus
// one hidden case mixing letters, punctuation, and digits.

const { makeFunctionSuite } = require("./_common");

exports.run = makeFunctionSuite({
  file: "my_downcase.js",
  func: "my_downcase",
  cases: [
    { args: ["aBc"], expect: "abc" },
    { args: [""], expect: "" },
    { args: ["Hello World! 123"], expect: "hello world! 123" },
  ],
});
