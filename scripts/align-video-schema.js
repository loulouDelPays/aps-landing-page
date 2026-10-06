#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "src/_data/videos.json");
const siteVideos = path.join(root, "_site/assets/videos");

function videoInSite(name) {
  return fs.existsSync(path.join(siteVideos, name));
}

const demoInSite = videoInSite("APS-demo.mp4");
const testInSite = videoInSite("testimonials.mp4");

let before = { demoAvailable: false, testimonialsAvailable: false };
if (fs.existsSync(outPath)) {
  before = JSON.parse(fs.readFileSync(outPath, "utf8"));
}

if (
  before.demoAvailable === demoInSite &&
  before.testimonialsAvailable === testInSite
) {
  console.log("align-video-schema: already in sync");
  process.exit(0);
}

fs.writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      ...before,
      demoAvailable: demoInSite,
      testimonialsAvailable: testInSite,
    },
    null,
    2
  )}\n`
);

console.log(
  `align-video-schema: rebuild (demo=${demoInSite} testimonials=${testInSite})`
);
execSync("npx eleventy && node scripts/minify-css.js && node scripts/minify-js.js", {
  cwd: root,
  stdio: "inherit",
});
