"use strict";
// Static analysis of index.html + style.css: per-section background colors
// and widths at desktop and mobile breakpoints. 16 checks: file existence,
// 5 desktop colors, 5 desktop widths, 5 mobile widths.
//
// This is heuristic (regex/text-based CSS parsing, not real browser
// rendering), a deliberate tradeoff to avoid a headless-browser dependency.
// It can be fooled by unusual-but-valid CSS it doesn't recognize; it isn't
// a substitute for opening the page in a real browser.

const { parseStylesheet, effectiveDeclarations, percentOf } = require("../../lib/css");
const { parseColor, isColor } = require("../../lib/html");

const SECTIONS = [
  { key: "header", color: "#00B7EB", desktopWidth: 100 },
  { key: "hero", color: "#FF0000", desktopWidth: 100 },
  { key: "content", color: "#00FF00", desktopWidth: 50 },
  { key: "sidebar", color: "#800080", desktopWidth: 50 },
  { key: "footer", color: "#444444", desktopWidth: 100 },
];

/** Numeric flex-grow factor from `flex-grow` or the `flex` shorthand's first number, or null. */
function flexGrowOf(decls) {
  if (decls["flex-grow"] !== undefined) {
    const n = parseFloat(decls["flex-grow"]);
    return Number.isNaN(n) ? null : n;
  }
  if (decls["flex"] !== undefined) {
    const n = parseFloat(decls["flex"].trim().split(/\s+/)[0]);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function bodyIsColumnFlex(parsed, mode) {
  const decls = effectiveDeclarations(parsed, "body", mode);
  const display = (decls["display"] || "").toLowerCase();
  const direction = (decls["flex-direction"] || decls["flex-flow"] || "").toLowerCase();
  return display === "flex" && /column/.test(direction);
}

/**
 * Resolves a section's effective width percent for a mode, falling back to
 * two common flexbox defaults that never appear as a literal percentage:
 *  - a flex item with no sizing at all stretches to 100% of a column
 *    flex container's cross axis (no `width` needed)
 *  - two flex items with equal flex-grow (`flex: 1`, no explicit basis)
 *    split their row evenly -- 50/50 for exactly two
 */
function resolveWidthPercent(parsed, decls, key, mode) {
  const direct = percentOf(decls["width"] || decls["flex-basis"] || decls["flex"]);
  if (direct !== null) return direct;

  if (["header", "hero", "footer"].includes(key) && bodyIsColumnFlex(parsed, mode)) {
    const hasSizing = ["width", "flex-basis", "flex", "flex-grow"].some((p) => decls[p] !== undefined);
    if (!hasSizing) return 100;
  }

  if ((key === "content" || key === "sidebar") && mode === "desktop") {
    const other = key === "content" ? "sidebar" : "content";
    const otherDecls = effectiveDeclarations(parsed, other, mode);
    const myGrow = flexGrowOf(decls);
    const otherGrow = flexGrowOf(otherDecls);
    if (myGrow !== null && otherGrow !== null && myGrow === otherGrow) return 50;
  }

  return null;
}

exports.run = function (g) {
  const hasHtml = g.isFile("index.html");
  const hasCss = g.isFile("style.css");
  g.check(
    "is there an index.html and a style.css?",
    hasHtml && hasCss,
    hasHtml && hasCss ? "" : `missing: ${[!hasHtml && "index.html", !hasCss && "style.css"].filter(Boolean).join(", ")}`
  );

  if (!hasCss) {
    for (const s of SECTIONS) g.check(`desktop: ${s.key} background is ${s.color}`, false, "no style.css to check");
    for (const s of SECTIONS) g.check(`desktop: ${s.key} width is ${s.desktopWidth}%`, false, "no style.css to check");
    for (const s of SECTIONS) g.check(`mobile: ${s.key} width is 100%`, false, "no style.css to check");
    return;
  }

  const parsed = parseStylesheet(g.readText("style.css"));
  if (parsed.hasFloat) {
    g.note("style.css uses `float`, which fails this exercise even if the checks below pass -- flexbox is required");
  }

  for (const s of SECTIONS) {
    const decls = effectiveDeclarations(parsed, s.key, "desktop");
    const colorVal = decls["background-color"] || decls["background"];
    const ok = isColor(colorVal, parseColor(s.color));
    g.check(
      `desktop: ${s.key} background is ${s.color}`,
      ok,
      ok ? "" : `found ${colorVal ? JSON.stringify(colorVal) : "no background declared"} for .${s.key} in desktop mode`
    );
  }

  for (const s of SECTIONS) {
    const decls = effectiveDeclarations(parsed, s.key, "desktop");
    const pct = resolveWidthPercent(parsed, decls, s.key, "desktop");
    const ok = pct === s.desktopWidth;
    g.check(
      `desktop: ${s.key} width is ${s.desktopWidth}%`,
      ok,
      ok ? "" : `found width ${pct === null ? "undeclared" : pct + "%"} for .${s.key} in desktop mode`
    );
  }

  for (const s of SECTIONS) {
    const decls = effectiveDeclarations(parsed, s.key, "mobile");
    const pct = resolveWidthPercent(parsed, decls, s.key, "mobile");
    const ok = pct === 100;
    g.check(
      `mobile: ${s.key} width is 100%`,
      ok,
      ok ? "" : `found width ${pct === null ? "undeclared" : pct + "%"} for .${s.key} in mobile mode`
    );
  }
};
