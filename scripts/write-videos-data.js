#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "src/_data/videos.json");
const examplePath = path.join(root, "src/_data/videos.json.example");
if (!fs.existsSync(outPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, outPath);
}
const siteVideos = path.join(root, "_site/assets/videos");

function videoInSite(name) {
  return fs.existsSync(path.join(siteVideos, name));
}

/** Schema flags follow MP4 actually present in _site (not gitignored local assets alone). */
const demoAvailable = videoInSite("APS-demo.mp4");
const testimonialsAvailable = videoInSite("testimonials.mp4");

let existing = {};
if (fs.existsSync(outPath)) {
  existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
}

const data = {
  demoAvailable,
  testimonialsAvailable,
  demoUploadDate: existing.demoUploadDate || "2026-02-26",
  testimonialsUploadDate: existing.testimonialsUploadDate || "2026-02-26",
  demoDuration: existing.demoDuration || "PT2M",
  testimonialsDuration: existing.testimonialsDuration || "PT3M",
};

fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  `write-videos-data: demo=${demoAvailable} testimonials=${testimonialsAvailable}`
);
