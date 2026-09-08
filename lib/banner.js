"use strict";

// A homage to Qwasar's web-UI logo, not a reproduction of it -- that banner
// is drawn by their editor, not printed by the real `gandalf` process (every
// pasted transcript starts at "Booting Gandalf..."). Hand-drawn 5-row block
// letters, only shown when colors are on so piped/logged output stays clean.

const color = require("./color");

const LETTERS = {
  Q: [" ███ ", "█   █", "█   █", "█  ██", " ████"],
  W: ["█     █", "█     █", "█  █  █", "█ █ █ █", " █   █ "],
  A: [" ██ ", "█  █", "████", "█  █", "█  █"],
  S: [" ████", "█    ", " ███ ", "    █", "████ "],
  R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
  I: ["███", " █ ", " █ ", " █ ", "███"],
  O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
  ".": ["  ", "  ", "  ", "  ", "██"],
};

function renderWord(word) {
  const rows = ["", "", "", "", ""];
  for (const ch of word) {
    const glyph = LETTERS[ch];
    if (!glyph) continue;
    for (let r = 0; r < 5; r++) rows[r] += glyph[r] + " ";
  }
  return rows;
}

function printBanner() {
  if (!color.enabled) return; // keep piped/logged output plain and clean
  console.log("");
  for (const row of renderWord("QWASAR.IO")) console.log(color.green(row));
  console.log("");
}

module.exports = { printBanner };
