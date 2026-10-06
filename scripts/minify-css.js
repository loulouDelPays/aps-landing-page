#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import CleanCSS from "clean-css";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "_site/css/main.css");

if (!fs.existsSync(target)) {
  console.warn("minify-css: _site/css/main.css absent, skip");
  process.exit(0);
}

const input = fs.readFileSync(target, "utf8");
const output = new CleanCSS({ level: 1 }).minify(input);
if (output.errors?.length) {
  console.error(output.errors.join("\n"));
  process.exit(1);
}
fs.writeFileSync(target, output.styles);
console.log(`minify-css: ${target} (${input.length} → ${output.styles.length} bytes)`);
