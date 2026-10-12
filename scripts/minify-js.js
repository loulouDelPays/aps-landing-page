#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsDir = path.join(root, "_site/js");
if (!fs.existsSync(jsDir)) {
  console.warn("minify-js: _site/js absent, skip");
  process.exit(0);
}

for (const name of fs.readdirSync(jsDir)) {
  if (!name.endsWith(".js")) continue;
  const target = path.join(jsDir, name);
  const input = fs.readFileSync(target, "utf8");
  const result = await esbuild.transform(input, {
    minify: true,
    target: "es2020",
  });
  fs.writeFileSync(target, result.code);
  console.log(`minify-js: ${target} (${input.length} → ${result.code.length} bytes)`);
}
