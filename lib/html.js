"use strict";

// A real parser (jsdom, etc.) would be more correct, but these exercises hand
// us small, predictable HTML, and pulling in a dependency for it would break
// the "just needs Node" promise. These helpers are deliberately narrow: they
// assume no nested elements of the same tag name inside the one being
// searched for, which is true for every exercise that uses them.

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Strips tags and collapses whitespace. */
function textContent(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** First `<tagName>...</tagName>` in the document, or null. */
function getTag(html, tagName) {
  const re = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "i");
  const m = re.exec(html);
  return m ? { outer: m[0], inner: m[1] } : null;
}

/** All `<tagName>...</tagName>` matches in the document. */
function getTags(html, tagName) {
  const re = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push({ outer: m[0], inner: m[1] });
  return out;
}

/**
 * Element whose opening tag carries id="id", with depth-aware matching so a
 * nested element of the *same* tag name doesn't confuse the closing tag.
 */
function getElementById(html, id) {
  const openRe = new RegExp(`<([a-zA-Z0-9]+)([^>]*\\bid=["']${id}["'][^>]*)>`, "i");
  const open = openRe.exec(html);
  if (!open) return null;

  const tag = open[1];
  const attrs = open[2];
  const afterOpen = open.index + open[0].length;

  const scanRe = new RegExp(`<${tag}(?:\\s[^>]*)?>|</${tag}>`, "gi");
  scanRe.lastIndex = afterOpen;
  let depth = 1;
  let m;
  while ((m = scanRe.exec(html)) !== null) {
    if (m[0].toLowerCase().startsWith("</")) {
      depth--;
      if (depth === 0) {
        return {
          tag,
          attrs,
          outer: html.slice(open.index, scanRe.lastIndex),
          inner: html.slice(afterOpen, m.index),
        };
      }
    } else {
      depth++;
    }
  }
  return null;
}

function getAttr(attrsString, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
  const m = re.exec(attrsString);
  if (!m) return null;
  return m[2] !== undefined ? m[2] : m[3];
}

/** [{cells: [text, ...]}] for every <tr> in the given HTML. */
function getRows(html) {
  return getTags(html, "tr").map((tr) => ({
    cells: [...getTags(tr.inner, "td"), ...getTags(tr.inner, "th")].map((c) => textContent(c.inner)),
  }));
}

// --- colour matching -----------------------------------------------------

const NAMED = { red: [255, 0, 0], black: [0, 0, 0], white: [255, 255, 255] };

function parseColor(value) {
  if (!value) return null;
  const v = value.trim().toLowerCase();

  let m = /^#([0-9a-f]{6})$/.exec(v);
  if (m) {
    const n = m[1];
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }

  m = /^#([0-9a-f]{3})$/.exec(v);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));

  m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(v);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];

  if (NAMED[v]) return NAMED[v];
  return null;
}

function isColor(value, [r, g, b]) {
  const parsed = parseColor(value);
  return !!parsed && parsed[0] === r && parsed[1] === g && parsed[2] === b;
}

/**
 * Effective background for an element with the given id: inline `style=`
 * takes precedence over any `<style>` block targeting `#id` (last rule
 * wins within each source) -- a simplified stand-in for the real CSS
 * cascade, adequate for these exercises.
 */
function backgroundOf(html, id) {
  const el = getElementById(html, id);
  const declarations = [];

  for (const block of getTags(html, "style")) {
    const re = new RegExp(`#${id}\\s*\\{([^}]*)\\}`, "gi");
    let m;
    while ((m = re.exec(block.inner)) !== null) declarations.push(m[1]);
  }
  if (el) {
    const inlineStyle = getAttr(el.attrs, "style");
    if (inlineStyle) declarations.push(inlineStyle);
  }

  const combined = declarations.join(";");
  const all = [...combined.matchAll(/background(?:-color)?\s*:\s*([^;]+)/gi)];
  if (!all.length) return null;
  return all[all.length - 1][1].trim();
}

// --- script extraction & execution -----------------------------------------

/** Inline `<script>` bodies (external `src=` scripts are skipped). */
function extractScripts(html) {
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || "";
    if (/\bsrc\s*=/.test(attrs)) continue;
    out.push(m[2]);
  }
  return out;
}

/**
 * Runs every inline script in one shared context and returns:
 *   { context, logs, error, getGlobal }
 * `logs` holds the arguments of every console.log call, space-joined.
 * A bare `age = 34;` becomes a property on the sandbox object; `let`/`const`
 * bindings are still visible to later `getGlobal()` probes because Node's vm
 * keeps a persistent lexical environment per context across script runs, the
 * same way multiple <script> tags share global scope in a real page.
 */
function runScripts(scripts, { timeout = 2000 } = {}) {
  const vm = require("vm");
  const logs = [];
  const sandbox = {
    console: {
      log: (...args) => logs.push(args.map(String).join(" ")),
      info: (...args) => logs.push(args.map(String).join(" ")),
      warn: () => {},
      error: () => {},
    },
  };
  const context = vm.createContext(sandbox);

  let error = null;
  for (const src of scripts) {
    try {
      new vm.Script(src, { filename: "index.html" }).runInContext(context, { timeout });
    } catch (e) {
      error = e;
      break;
    }
  }

  function getGlobal(name) {
    try {
      return new vm.Script(
        `(function(){ try { return typeof ${name} !== "undefined" ? ${name} : undefined; } ` +
          `catch (e) { return undefined; } })()`
      ).runInContext(context);
    } catch {
      return undefined;
    }
  }

  return { context, logs, error, getGlobal };
}

module.exports = {
  textContent, getTag, getTags, getElementById, getAttr, getRows,
  parseColor, isColor, backgroundOf, extractScripts, runScripts,
};
