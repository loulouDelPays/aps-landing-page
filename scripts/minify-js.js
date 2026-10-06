#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "_site/js/main.js");

if (!fs.existsSync(target)) {
  console.warn("minify-js: _site/js/main.js absent, skip");
  process.exit(0);
}

const input = fs.readFileSync(target, "utf8");
const result = await esbuild.transform(input, {
  minify: true,
  target: "es2020",
});

fs.writeFileSync(target, result.code);
console.log(`minify-js: ${target} (${input.length} → ${result.code.length} bytes)`);
