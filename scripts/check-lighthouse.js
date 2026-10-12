#!/usr/bin/env node
/**
 * Lighthouse sur la landing Ads (serveur local requis).
 * Usage: npm run serve puis npm run check:lighthouse
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url =
  process.env.LH_URL || "http://localhost:8080/assistant-achats-pieces-carrosserie/";
const minPerf = Number(process.env.LH_MIN_PERF || "90");
const minA11y = Number(process.env.LH_MIN_A11Y || "90");
const minBp = Number(process.env.LH_MIN_BP || "90");

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const args = [
  "--yes",
  "lighthouse",
  url,
  "--only-categories=performance,accessibility,best-practices",
  "--preset=desktop",
  "--quiet",
  "--output=json",
  "--output-path=stdout",
  "--chrome-flags=--headless --no-sandbox",
];

const res = spawnSync(npx, args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
if (res.status !== 0) {
  console.error("check-lighthouse: échec Lighthouse (serveur local démarré ? npm run serve)");
  if (res.stderr) console.error(res.stderr.slice(0, 2000));
  process.exit(1);
}

let report;
try {
  report = JSON.parse(res.stdout);
} catch (e) {
  console.error("check-lighthouse: JSON Lighthouse illisible", e.message);
  process.exit(1);
}

const scores = {
  performance: report.categories?.performance?.score ?? 0,
  accessibility: report.categories?.accessibility?.score ?? 0,
  "best-practices": report.categories?.["best-practices"]?.score ?? 0,
};

const pct = (s) => Math.round((s || 0) * 100);
console.log(
  `check-lighthouse: perf=${pct(scores.performance)} a11y=${pct(scores.accessibility)} bp=${pct(scores["best-practices"])}`
);

const failures = [];
if (pct(scores.performance) < minPerf) failures.push(`performance ${pct(scores.performance)} < ${minPerf}`);
if (pct(scores.accessibility) < minA11y) failures.push(`accessibility ${pct(scores.accessibility)} < ${minA11y}`);
if (pct(scores["best-practices"]) < minBp) failures.push(`best-practices ${pct(scores["best-practices"])} < ${minBp}`);

if (failures.length) {
  console.error("check-lighthouse failed:\n  - " + failures.join("\n  - "));
  process.exit(1);
}
console.log("check-lighthouse: OK");
