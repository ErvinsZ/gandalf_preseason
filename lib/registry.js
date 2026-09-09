"use strict";

const fs = require("fs");
const path = require("path");

const QUESTS_ENV = "GANDALF_QUESTS_DIR";

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

class Exercise {
  constructor(quest, spec) {
    this.quest = quest;
    this.dir = spec.dir;
    this.title = spec.title;
    this.module = spec.module || spec.dir;
    this.points = Number(spec.points);
    this.rspec = !!spec.rspec;
  }

  get modulePath() {
    return path.join(this.quest.path, this.module + ".js");
  }
}

class Quest {
  constructor(questPath, spec) {
    this.path = questPath;
    this.name = spec.name;
    this.description = spec.description || "";
    this.aliases = new Set((spec.aliases || []).map(normalize));
    this.aliases.add(normalize(this.name));
    this.exercises = spec.exercises.map((e) => new Exercise(this, e));
  }

  matches(dirname) {
    return this.aliases.has(normalize(dirname));
  }

  exercise(dirname) {
    return this.exercises.find((e) => e.dir === dirname) || null;
  }
}

function questsDir(root) {
  return process.env[QUESTS_ENV] || path.join(root, "quests");
}

function loadQuests(root) {
  const base = questsDir(root);
  const quests = [];
  if (!fs.existsSync(base)) return quests;

  for (const entry of fs.readdirSync(base).sort()) {
    const manifest = path.join(base, entry, "quest.json");
    if (!fs.existsSync(manifest)) continue;
    const spec = JSON.parse(fs.readFileSync(manifest, "utf8"));
    quests.push(new Quest(path.join(base, entry), spec));
  }
  return quests;
}

function findQuest(quests, dirname) {
  return quests.find((q) => q.matches(dirname)) || null;
}

module.exports = { normalize, loadQuests, findQuest, Quest, Exercise };
