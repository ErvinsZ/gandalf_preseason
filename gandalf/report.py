"""Rendering of the report table, laid out like the real gandalf output.

Layout rules (reverse engineered from real output):

      REPORT        MY-FIRST-FILE
                                     <- blank line
 Status             SUCCESS
 Execution Runtime  0.000065
 Score              [=] 1/1

Column 1 is `max(len(label))` wide (17 = len("Execution Runtime")), padded with
one leading space and two trailing spaces.  Column 2 is `max(len(value))` wide
with one trailing space.  The header row centers both cells, data rows are left
aligned.  Trailing whitespace is intentional: it is present in the real output.
"""

LABELS = ("REPORT", "Status", "Execution Runtime", "Score")


def _center(text, width):
    """Center, biasing the leftover space to the right (str.center biases left)."""
    left = (width - len(text)) // 2
    return " " * max(0, left) + text.ljust(width - max(0, left))


def score_bar(passed, total):
    """[=] 1/1, [==] 2/2, [======] 6/6 ... failures render as '-'."""
    passed = max(0, min(passed, total))
    return "[%s%s] %d/%d" % ("=" * passed, "-" * (total - passed), passed, total)


def render(title, status, runtime, passed, total):
    values = (title, status, "%.6f" % runtime, score_bar(passed, total))

    w1 = max(len(x) for x in LABELS)
    w2 = max(len(x) for x in values)

    lines = []
    lines.append(" " + _center(LABELS[0], w1) + "  " + _center(values[0], w2) + " ")
    lines.append("")
    for label, value in zip(LABELS[1:], values[1:]):
        lines.append(" " + label.ljust(w1) + "  " + value.ljust(w2) + " ")
    return "\n".join(lines)
