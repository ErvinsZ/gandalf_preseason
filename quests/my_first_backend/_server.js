"use strict";
// This exercise's app.js genuinely needs `express` to run. The student's
// own repo must stay dependency-free (per the exercise's own rules), so we
// cache an install here instead -- in *our* quest folder, gitignored, once
// ever, then point the student's process at it via NODE_PATH without ever
// touching their sandboxed copy.

const fs = require("fs");
const path = require("path");
const http = require("http");
const { execSync, spawn } = require("child_process");

const DEPS_DIR = __dirname;
const NODE_MODULES = path.join(DEPS_DIR, "node_modules");

function ensureExpress() {
  const expressPath = path.join(NODE_MODULES, "express");
  if (fs.existsSync(expressPath)) return { ok: true };
  try {
    execSync("npm install express --no-audit --no-fund --loglevel=error", {
      cwd: DEPS_DIR,
      stdio: "pipe",
      timeout: 60000,
    });
    return { ok: fs.existsSync(expressPath) };
  } catch (e) {
    return { ok: false, error: (e.stderr || e.message || String(e)).toString().split("\n")[0] };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A single GET request; never throws -- network/timeout errors come back as { error }. */
function httpGet(port, urlPath, headers = {}) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: urlPath, method: "GET", headers, timeout: 3000 },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on("error", (e) => resolve({ error: e.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ error: "timeout" });
    });
    req.end();
  });
}

/** Spawns `node app.js` in `cwd`, with NODE_PATH pointing at our cached express. */
function startServer(cwd, port) {
  const child = spawn(process.execPath, ["app.js"], {
    cwd,
    env: Object.assign({}, process.env, { NODE_PATH: NODE_MODULES, PORT: String(port) }),
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  let stdout = "";
  child.stderr.on("data", (d) => (stderr += d));
  child.stdout.on("data", (d) => (stdout += d));
  return { child, getStderr: () => stderr, getStdout: () => stdout };
}

async function waitForServer(port, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await httpGet(port, "/");
    if (!res.error) return true;
    await sleep(150);
  }
  return false;
}

function stopServer(child) {
  try {
    child.kill("SIGKILL");
  } catch {
    /* already gone */
  }
}

module.exports = { ensureExpress, httpGet, startServer, waitForServer, stopServer, sleep };
