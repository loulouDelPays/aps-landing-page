#!/usr/bin/env node
/**
 * Vérifie la page CRM demo et la construction des URLs d'acquisition.
 * Usage: npm run check:crm
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchCrmStatus } from "./write-crm-status.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitePath = path.join(root, "src/_data/site.json");
const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));
const demoBase = site.demoUrl || "https://crm.aps-logiciel.fr/demo";

const ACQ = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
];

const sample = new URL(demoBase);
sample.searchParams.set("utm_source", "google");
sample.searchParams.set("utm_medium", "cpc");
sample.searchParams.set("utm_campaign", "assistant_achats");
sample.searchParams.set("gclid", "test_gclid_verify");

const warnings = [];
const errors = [];

const status = await fetchCrmStatus();
const outPath = path.join(root, "src/_data/crmStatus.json");
fs.writeFileSync(outPath, JSON.stringify(status, null, 2) + "\n");

if (!status.httpOk && !status.unreachable) errors.push("CRM demo HTTP indisponible");
if (!status.demoPageOk && !status.unreachable) {
  errors.push("CRM demo : page de réservation non reconnue (structure HTML)");
}
if (status.unreachable) {
  warnings.push("Impossible de joindre le CRM — vérifier manuellement dans un navigateur.");
}

console.log("verify-crm-demo");
console.log(`  Demo URL (exemple avec UTM): ${sample.toString()}`);
console.log(`  Paramètres à conserver: ${ACQ.join(", ")}`);
console.log(`  crmStatus.demoPageOk=${status.demoPageOk}`);
console.log(
  "  Note: les créneaux se chargent en JavaScript sur crm.aps-logiciel.fr — ouvrir la page pour les valider."
);
if (warnings.length) {
  console.warn("Avertissements:\n" + warnings.map((w) => `  - ${w}`).join("\n"));
}
if (errors.length) {
  console.error("Erreurs:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log("verify-crm-demo: OK (voir avertissements éventuels)");
