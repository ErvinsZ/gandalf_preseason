"use strict";
// A hand-rolled CSS parser, not a spec-compliant one. It's built for exactly
// what these exercises need: bucket rules into "base", "inside a mobile
// (max-width) media query", or "inside a desktop (min-width) media query",
// then resolve the effective declarations for a selector in either mode
// using a simplified cascade (mode-specific rules override base, later
// same-bucket rules override earlier ones). Real cascade/specificity rules
// (id vs class weight, !important, etc.) are not modeled -- this is a
// heuristic static-analysis pass, not a browser.

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Splits a stylesheet into { base, media: [{condition, body}] }, handling
 * one level of brace nesting inside @media blocks. */
function splitMediaBlocks(css) {
  const media = [];
  let base = "";
  let lastIndex = 0;
  const re = /@media\s*([^{]+)\{/gi;
  let m;
  while ((m = re.exec(css)) !== null) {
    base += css.slice(lastIndex, m.index);
    const condition = m[1].trim();
    let depth = 1;
    let j = re.lastIndex;
    while (depth > 0 && j < css.length) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    media.push({ condition, body: css.slice(re.lastIndex, j - 1) });
    lastIndex = j;
    re.lastIndex = j;
  }
  base += css.slice(lastIndex);
  return { base, media };
}

/** Parses `selector, selector { prop: value; ... }` blocks into rule objects. */
function parseRules(css) {
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const selectors = m[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const decls = {};
    for (const d of m[2].split(";")) {
      const idx = d.indexOf(":");
      if (idx === -1) continue;
      const prop = d.slice(0, idx).trim().toLowerCase();
      const value = d.slice(idx + 1).trim();
      if (prop) decls[prop] = value;
    }
    rules.push({ selectors, decls });
  }
  return rules;
}

function classifyCondition(condition) {
  const maxWidth = /max-width\s*:\s*(\d+(?:\.\d+)?)/i.exec(condition);
  const minWidth = /min-width\s*:\s*(\d+(?:\.\d+)?)/i.exec(condition);
  if (maxWidth && Number(maxWidth[1]) <= 640) return "mobile";
  if (minWidth && Number(minWidth[1]) >= 640) return "desktop";
  return "other";
}

/**
 * Parses a stylesheet into three rule buckets (base/mobile/desktop) plus
 * whether `float` appears anywhere (the exercise explicitly disallows it).
 */
function parseStylesheet(cssText) {
  const css = stripComments(cssText);
  const { base, media } = splitMediaBlocks(css);

  const buckets = { base: parseRules(base), mobile: [], desktop: [] };
  for (const block of media) {
    const kind = classifyCondition(block.condition);
    if (kind === "mobile" || kind === "desktop") buckets[kind].push(...parseRules(block.body));
  }

  return { ...buckets, hasFloat: /(?<![-\w])float\s*:/i.test(css) };
}

/** True if any of a rule's selectors names `section` as a class, id, or bare tag. */
function selectorMatches(selectors, section) {
  const re = new RegExp(`(^|[.#\\s>+~,])${section}([^a-z0-9_-]|$)`, "i");
  return selectors.some((s) => re.test(s));
}

/**
 * Resolves the effective declarations for `section` in the given mode
 * ("mobile" or "desktop"): base rules matching the section, overridden by
 * any mode-specific rules matching it (later rules win within each bucket).
 */
function effectiveDeclarations(parsed, section, mode) {
  const merge = (rules) =>
    rules.filter((r) => selectorMatches(r.selectors, section)).reduce((acc, r) => Object.assign(acc, r.decls), {});
  return Object.assign(merge(parsed.base), merge(parsed[mode]));
}

/** Extracts a percentage number from a width/flex-basis/flex value, or null. */
function percentOf(value) {
  if (!value) return null;
  const m = /(\d+(?:\.\d+)?)\s*%/.exec(value);
  return m ? Number(m[1]) : null;
}

module.exports = { parseStylesheet, effectiveDeclarations, percentOf, selectorMatches };
