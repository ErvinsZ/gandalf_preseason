"use strict";
// A real Express app is started as a subprocess and exercised with real
// HTTP requests. 8 checks matching the real gandalf output. Frank Sinatra's
// birth date/city and wives' names are verified against the reference
// facts Wikipedia gives (confirmed against a known-passing real submission).

const { ensureExpress, httpGet, startServer, waitForServer, stopServer } = require("./_server");

const FILE = "app.js";
const PORT = 8080; // the exercise hardcodes this, not env-configurable

const BIRTH_DATE = "December 12, 1915";
const BIRTH_CITY = "Hoboken, New Jersey";
const WIVES = "Nancy Barbato, Ava Gardner, Mia Farrow, Barbara Marx";
const PROTECTED_MESSAGE = "Welcome, authenticated client";
const PUBLIC_MESSAGE = "Everybody can see this page";

const LABELS = [
  "simple GET request on /",
  "multiple GET request on / (random song pool)",
  "GET /birth_date returns his birthday?",
  "GET /birth_city returns his birth city?",
  "GET /wives returns list of his wives?",
  "GET /picture redirects to his picture?",
  "GET /protected without access is rejected (401)?",
  "GET /protected with admin:admin succeeds (200)?",
  "response includes the required security headers?",
];

const REQUIRED_HEADERS = {
  "x-xss-protection": "1; mode=block",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
};

function eq(actual, expected) {
  return typeof actual === "string" && actual.trim() === expected;
}

function basicAuthHeader(user, pass) {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

exports.run = async function (g) {
  const hasFile = g.isFile(FILE);
  if (!hasFile) {
    for (const l of LABELS) g.check(l, false, g.exists(FILE) ? "" : "no such file in this directory");
    return;
  }

  const dep = ensureExpress();
  if (!dep.ok) {
    for (const l of LABELS) g.check(l, false, `couldn't install express for grading: ${dep.error || "unknown error"}`);
    return;
  }

  const { child, getStderr } = startServer(g.sandbox, PORT);
  try {
    const up = await waitForServer(PORT);
    if (!up) {
      const detail = getStderr().trim().split("\n")[0] || "server did not respond on port 8080 within 8s";
      for (const l of LABELS) g.check(l, false, detail);
      return;
    }

    // -- simple GET / --
    const r1 = await httpGet(PORT, "/");
    const simpleOk = r1.status === 200 && !!r1.body && r1.body.trim().length > 0;
    g.check(LABELS[0], simpleOk, simpleOk ? "" : r1.error ? r1.error : `got status ${r1.status}, body ${JSON.stringify(r1.body)}`);

    // -- required security headers (shown in the exercise's own curl examples) --
    const missingHeaders = Object.entries(REQUIRED_HEADERS).filter(([name, value]) => (r1.headers || {})[name] !== value);
    const headersOk = missingHeaders.length === 0;
    g.check(
      LABELS[8],
      headersOk,
      headersOk
        ? ""
        : `missing/wrong: ${missingHeaders.map(([name, want]) => `${name} (expected "${want}", got ${JSON.stringify((r1.headers || {})[name])})`).join(", ")}`
    );

    // -- multiple GET / (expect variety, i.e. an actual pool, not one hardcoded title) --
    const samples = [];
    for (let i = 0; i < 12; i++) samples.push((await httpGet(PORT, "/")).body);
    const distinct = new Set(samples.filter(Boolean).map((s) => s.trim()));
    const multipleOk = distinct.size >= 2;
    g.check(LABELS[1], multipleOk, multipleOk ? "" : `got the same response every time: ${JSON.stringify(samples[0])} -- is / really random from a pool?`);

    // -- fixed-fact routes --
    const rBirthDate = await httpGet(PORT, "/birth_date");
    const birthDateOk = eq(rBirthDate.body, BIRTH_DATE);
    g.check(
      LABELS[2],
      birthDateOk,
      birthDateOk ? "" : `must return the exact string "${BIRTH_DATE}" -- got ${JSON.stringify(rBirthDate.body)}. This is a strict format check (exact text, case-sensitive), not a factual-accuracy one.`
    );

    const rBirthCity = await httpGet(PORT, "/birth_city");
    const birthCityOk = eq(rBirthCity.body, BIRTH_CITY);
    g.check(
      LABELS[3],
      birthCityOk,
      birthCityOk ? "" : `must return the exact string "${BIRTH_CITY}" -- got ${JSON.stringify(rBirthCity.body)}. This is a strict format check (exact text, case-sensitive), not a factual-accuracy one.`
    );

    const rWives = await httpGet(PORT, "/wives");
    const wivesOk = eq(rWives.body, WIVES);
    g.check(
      LABELS[4],
      wivesOk,
      wivesOk ? "" : `must return the exact string "${WIVES}" (format: "wife1, wife2, wife3, wife4") -- got ${JSON.stringify(rWives.body)}. This is a strict format check, not a factual-accuracy one.`
    );

    // -- redirect to picture --
    const rPicture = await httpGet(PORT, "/picture");
    const location = (rPicture.headers && rPicture.headers.location) || "";
    const pictureOk = rPicture.status >= 300 && rPicture.status < 400 && /wikipedia/i.test(location) && /frank_sinatra/i.test(location);
    g.check(
      LABELS[5],
      pictureOk,
      pictureOk ? "" : `got status ${rPicture.status}, Location: ${JSON.stringify(location)} -- expected a redirect to his Wikipedia picture`
    );

    // -- protected: no auth, and also wrong credentials (not just absent) --
    const rNoAuth = await httpGet(PORT, "/protected");
    const rWrongAuth = await httpGet(PORT, "/protected", { Authorization: basicAuthHeader("admin", "wrongpassword") });
    const noAuthOk = rNoAuth.status === 401 && rWrongAuth.status === 401;
    g.check(
      LABELS[6],
      noAuthOk,
      noAuthOk
        ? ""
        : rNoAuth.status !== 401
        ? `no credentials: got status ${rNoAuth.status}, expected 401`
        : `wrong password (admin:wrongpassword) got status ${rWrongAuth.status}, expected 401 -- is the password actually being checked?`
    );

    // -- protected: correct auth --
    const rAuth = await httpGet(PORT, "/protected", { Authorization: basicAuthHeader("admin", "admin") });
    const authOk = rAuth.status === 200 && eq(rAuth.body, PROTECTED_MESSAGE);
    g.check(
      LABELS[7],
      authOk,
      authOk
        ? ""
        : rAuth.status !== 200
        ? `got status ${rAuth.status}, expected 200`
        : `must return the exact string "${PROTECTED_MESSAGE}" -- got ${JSON.stringify(rAuth.body)}. This is a strict format check (exact text, case-sensitive), not a functional one -- authentication itself worked.`
    );

    // -- /public: described in the spec but not part of the real 8-check
    // score, kept as an advisory note rather than a scored check.
    const rPublic = await httpGet(PORT, "/public");
    if (!(rPublic.status === 200 && eq(rPublic.body, PUBLIC_MESSAGE))) {
      g.note(`GET /public didn't return 200 "${PUBLIC_MESSAGE}" (got status ${rPublic.status}, body ${JSON.stringify(rPublic.body)})`);
    }
  } finally {
    stopServer(child);
  }
};
