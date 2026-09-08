"""Work out what to grade, based on where the user stands.

Walking up from the current directory:

  preseason/quest00           -> grade every exercise of quest00
  preseason/quest00/ex04      -> grade ex04 only
  preseason/quest00/ex04/src  -> grade ex04 only (deepest match wins)
  preseason/                  -> nothing to grade
"""

import os
import re

from .registry import find_quest

EX_RE = re.compile(r"^ex\d+$", re.IGNORECASE)


class Context(object):
    def __init__(self, quest, quest_path, exercise=None):
        self.quest = quest
        self.quest_path = quest_path
        self.exercise = exercise

    @property
    def exercises(self):
        return [self.exercise] if self.exercise else list(self.quest.exercises)


def detect(cwd, quests):
    path = os.path.realpath(cwd)
    while True:
        parent, name = os.path.split(path)
        if not name:
            return None

        if EX_RE.match(name):
            grandparent, quest_name = os.path.split(parent)
            quest = find_quest(quests, quest_name)
            if quest:
                exercise = quest.exercise(name.lower())
                if exercise:
                    return Context(quest, parent, exercise)
                return Context(quest, parent, None)

        quest = find_quest(quests, name)
        if quest:
            return Context(quest, path, None)

        if parent == path:
            return None
        path = parent
