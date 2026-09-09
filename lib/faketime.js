"use strict";
// A deterministic fake clock for exercises that animate via setInterval and
// need their *pacing* verified without actually blocking real wall-clock
// time. setInterval/setTimeout are replaced with versions that just record
// { callback, delay }; advanceTo() jumps directly from one due event to the
// next rather than waiting or stepping millisecond by millisecond.

function makeFakeClock() {
  let now = 0;
  let nextId = 1;
  const intervals = new Map();
  const timeouts = new Map();

  function setInterval(fn, delay) {
    const id = nextId++;
    intervals.set(id, { fn, delay, next: now + delay });
    return id;
  }
  function clearInterval(id) {
    intervals.delete(id);
  }
  function setTimeout(fn, delay) {
    const id = nextId++;
    timeouts.set(id, { fn, time: now + delay });
    return id;
  }
  function clearTimeout(id) {
    timeouts.delete(id);
  }

  /** Jumps directly from due event to due event, up to `target` ms. */
  function advanceTo(target) {
    for (;;) {
      let nextTime = Infinity;
      for (const iv of intervals.values()) nextTime = Math.min(nextTime, iv.next);
      for (const to of timeouts.values()) nextTime = Math.min(nextTime, to.time);
      if (nextTime === Infinity || nextTime > target) break;
      now = nextTime;
      for (const [id, to] of Array.from(timeouts.entries())) {
        if (to.time === now) {
          timeouts.delete(id);
          try { to.fn(); } catch { /* let the exercise's own logic surface issues in state, not here */ }
        }
      }
      for (const [id, iv] of Array.from(intervals.entries())) {
        if (iv.next === now) {
          iv.next += iv.delay;
          try { iv.fn(); } catch { /* ditto */ }
        }
      }
    }
    now = target;
  }

  return {
    setInterval, clearInterval, setTimeout, clearTimeout, advanceTo,
    get now() { return now; },
    get activeIntervals() { return intervals.size; },
  };
}

module.exports = { makeFakeClock };
