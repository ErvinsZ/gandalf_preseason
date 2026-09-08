"use strict";

const path = require("path");
const { findQuest } = require("./registry");

const EX_RE = /^ex\d+$/i;

class Context {
  constructor(quest, questPath, exercise) {
    this.quest = quest;
    this.questPath = questPath;
    this.exercise = exercise || null;
  }

  get exercises() {
    return this.exercise ? [this.exercise] : this.quest.exercises.slice();
  }
}

function detect(cwd, quests) {
  let p = path.resolve(cwd);

  for (;;) {
    const name = path.basename(p);
    const parent = path.dirname(p);
    if (!name) return null;

    if (EX_RE.test(name)) {
      const questDir = parent;
      const questName = path.basename(questDir);
      const quest = findQuest(quests, questName);
      if (quest) {
        const exercise = quest.exercise(name.toLowerCase());
        return new Context(quest, questDir, exercise);
      }
    }

    const quest = findQuest(quests, name);
    if (quest) return new Context(quest, p, null);

    if (parent === p) return null;
    p = parent;
  }
}

module.exports = { detect, Context };
