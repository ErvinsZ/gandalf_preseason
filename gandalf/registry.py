"""Discovery of quest definitions.

Every quest lives in `quests/<name>/quest.json`:

    {
      "name": "quest00",
      "aliases": ["quest00", "js-quest00"],
      "exercises": [
        {"dir": "ex00", "title": "MY-FIRST-FILE", "module": "ex00", "points": 1}
      ]
    }

`aliases` are matched against the directory name on disk, normalized (lowercase,
dashes/underscores/spaces removed), so `js-quest01`, `js_quest01` and `JSQuest01`
all resolve to the same quest.
"""

import json
import os

QUESTS_ENV = "GANDALF_QUESTS_DIR"


def normalize(name):
    return "".join(c for c in name.lower() if c.isalnum())


class Exercise(object):
    def __init__(self, quest, spec):
        self.quest = quest
        self.dir = spec["dir"]
        self.title = spec["title"]
        self.module = spec.get("module", spec["dir"])
        self.points = int(spec["points"])

    @property
    def module_path(self):
        return os.path.join(self.quest.path, self.module + ".py")


class Quest(object):
    def __init__(self, path, spec):
        self.path = path
        self.name = spec["name"]
        self.description = spec.get("description", "")
        self.aliases = set(normalize(a) for a in spec.get("aliases", []))
        self.aliases.add(normalize(self.name))
        self.exercises = [Exercise(self, e) for e in spec["exercises"]]

    def matches(self, dirname):
        return normalize(dirname) in self.aliases

    def exercise(self, dirname):
        for ex in self.exercises:
            if ex.dir == dirname:
                return ex
        return None


def quests_dir(root):
    return os.environ.get(QUESTS_ENV) or os.path.join(root, "quests")


def load_quests(root):
    base = quests_dir(root)
    quests = []
    if not os.path.isdir(base):
        return quests
    for entry in sorted(os.listdir(base)):
        manifest = os.path.join(base, entry, "quest.json")
        if not os.path.isfile(manifest):
            continue
        with open(manifest) as fh:
            spec = json.load(fh)
        quests.append(Quest(os.path.join(base, entry), spec))
    return quests


def find_quest(quests, dirname):
    for quest in quests:
        if quest.matches(dirname):
            return quest
    return None
