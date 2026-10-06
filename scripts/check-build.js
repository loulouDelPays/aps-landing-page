#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "_site");

function walkHtml(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkHtml(p, acc);
    else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const errors = [];
const htmlFiles = walkHtml(siteDir);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(siteDir, file);
  const h1 = (html.match(/<h1\b/g) || []).length;
  if (h1 !== 1) errors.push(`${rel}: expected 1 h1, got ${h1}`);

  const is404 = rel === "404.html";
  if (is404) {
    if (!html.includes("noindex")) errors.push("404.html: missing noindex");
    if (html.includes('rel="canonical"')) errors.push("404.html: canonical must be absent");
  } else if (!html.includes('rel="canonical"')) {
    errors.push(`${rel}: missing canonical`);
  }

  if (html.includes('target="_blank"') && !html.includes("noopener")) {
    errors.push(`${rel}: target=_blank without noopener`);
  }
}

const faqSchemaPages = htmlFiles.filter((f) => {
  const html = fs.readFileSync(f, "utf8");
  return html.includes('"@type": "FAQPage"');
});
const allowedFaq = new Set(["index.html"]);
for (const file of faqSchemaPages) {
  const rel = path.relative(siteDir, file);
  if (!allowedFaq.has(rel)) {
    errors.push(`${rel}: unexpected FAQPage schema (only home allowed)`);
  }
}

let totalBytes = 0;
let videoBytes = 0;
function dirSize(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) dirSize(p);
    else {
      totalBytes += st.size;
      if (p.includes(`${path.sep}assets${path.sep}videos${path.sep}`) && name.endsWith(".mp4")) {
        videoBytes += st.size;
        const maxVideoMb = Number(process.env.MAX_VIDEO_MB || "25");
        if (st.size > maxVideoMb * 1024 * 1024) {
          errors.push(
            `${path.relative(siteDir, p)}: ${(st.size / 1024 / 1024).toFixed(1)} MiB exceeds ${maxVideoMb} MiB — re-run optimize-videos.sh`
          );
        }
      }
    }
  }
}
dirSize(siteDir);
const staticBytes = totalBytes - videoBytes;
const maxStaticMb = Number(process.env.MAX_STATIC_SITE_MB || "15");
if (staticBytes > maxStaticMb * 1024 * 1024) {
  errors.push(
    `_site static size ${(staticBytes / 1024 / 1024).toFixed(1)} MiB exceeds ${maxStaticMb} MiB`
  );
}

const videosJsonPath = path.join(root, "src/_data/videos.json");
const videosJson = fs.existsSync(videosJsonPath)
  ? JSON.parse(fs.readFileSync(videosJsonPath, "utf8"))
  : { demoAvailable: false, testimonialsAvailable: false };

const demoMp4 = path.join(siteDir, "assets/videos/APS-demo.mp4");
const testMp4 = path.join(siteDir, "assets/videos/testimonials.mp4");
const hasDemoMp4 = fs.existsSync(demoMp4);
const hasTestMp4 = fs.existsSync(testMp4);

const indexHtml = path.join(siteDir, "index.html");
if (fs.existsSync(indexHtml)) {
  const index = fs.readFileSync(indexHtml, "utf8");
  const hasDemoSchema = index.includes("Démonstration recherche AutoPartSelect");
  const hasTestSchema = index.includes("Témoignages carrossiers AutoPartSelect");

  if (videosJson.demoAvailable !== hasDemoMp4) {
    errors.push("videos.json demoAvailable out of sync with _site MP4");
  }
  if (videosJson.testimonialsAvailable !== hasTestMp4) {
    errors.push("videos.json testimonialsAvailable out of sync with _site MP4");
  }
  if (hasDemoSchema && !hasDemoMp4) {
    errors.push("index.html: VideoObject demo but APS-demo.mp4 missing in _site");
  }
  if (hasTestSchema && !hasTestMp4) {
    errors.push("index.html: VideoObject testimonials but testimonials.mp4 missing");
  }
  if (hasDemoMp4 && !hasDemoSchema) {
    errors.push("index.html: APS-demo.mp4 present but demo VideoObject missing");
  }
  if (hasTestMp4 && !hasTestSchema) {
    errors.push("index.html: testimonials.mp4 present but testimonial VideoObject missing");
  }
}

const favicon = path.join(siteDir, "assets/favicon.png");
if (!fs.existsSync(favicon)) {
  errors.push("assets/favicon.png missing in _site (header + schema logo)");
}

const legacyPages = [
  "tarifs/index.html",
  "faq/index.html",
  "demo/index.html",
  "temoignages/index.html",
  "fonctionnalites/index.html",
  "rentabilite/index.html",
  "a-propos/index.html",
  "recherche-pieces-carrosserie/index.html",
  "suivi-commandes-pieces/index.html",
  "gestion-rfa-carrosserie/index.html",
  "marketplace-pieces-carrosserie/index.html",
  "recherche-reliquats/index.html",
];
for (const legacy of legacyPages) {
  if (fs.existsSync(path.join(siteDir, legacy))) {
    errors.push(`${legacy}: legacy page should not be built (single landing)`);
  }
}

if (errors.length) {
  console.error("check-build failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(`check-build: OK (${htmlFiles.length} pages, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB _site)`);
