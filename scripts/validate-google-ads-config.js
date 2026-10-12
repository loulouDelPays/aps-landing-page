#!/usr/bin/env node
/**
 * Valide googleAdsCampaign.json, googleAdsCro.json et IDs Ads (site + env).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(fs.readFileSync(path.join(root, "src/_data/site.json"), "utf8"));

function readJson(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const errors = [];
const warnings = [];

const googleAdsId = (process.env.GOOGLE_ADS_ID || site.googleAdsId || "").trim();
const googleAdsConversionLabel = (process.env.GOOGLE_ADS_CONVERSION_LABEL || site.googleAdsConversionLabel || "").trim();

if (!googleAdsId || !/^AW-\d+$/.test(googleAdsId)) {
  warnings.push(
    "googleAdsId manquant ou invalide (attendu AW-XXXXXXXX). Définir dans site.json ou GOOGLE_ADS_ID."
  );
}
if (googleAdsId && !googleAdsConversionLabel) {
  warnings.push("googleAdsConversionLabel manquant (site.json ou GOOGLE_ADS_CONVERSION_LABEL).");
}

const campaign = readJson("src/_data/googleAdsCampaign.json");
if (!campaign) {
  errors.push("src/_data/googleAdsCampaign.json introuvable");
} else {
  if (!campaign.landingUrl?.includes("assistant-achats-pieces-carrosserie")) {
    errors.push("googleAdsCampaign.json: landingUrl doit pointer vers la landing Ads");
  }
  if (!Array.isArray(campaign.adGroups) || campaign.adGroups.length === 0) {
    errors.push("googleAdsCampaign.json: adGroups vide");
  } else {
    for (const g of campaign.adGroups) {
      if (!g.keywords?.length) errors.push(`googleAdsCampaign.json: ${g.id || g.name}: keywords vides`);
      if (!g.headlines?.length || g.headlines.length < 3) {
        errors.push(`googleAdsCampaign.json: ${g.id || g.name}: headlines insuffisants pour RSA`);
      }
    }
  }
  if (!Array.isArray(campaign.negativeKeywords) || campaign.negativeKeywords.length < 5) {
    warnings.push("googleAdsCampaign.json: peu de mots-clés négatifs");
  }
}

const cro = readJson("src/_data/googleAdsCro.json");
if (!cro) {
  warnings.push("src/_data/googleAdsCro.json introuvable");
} else if (!Array.isArray(cro.experiments) || cro.experiments.length === 0) {
  warnings.push("googleAdsCro.json: aucune expérience CRO définie");
}

console.log("validate-google-ads-config");
if (warnings.length) console.warn(warnings.map((w) => `  warn: ${w}`).join("\n"));
if (errors.length) {
  console.error(errors.map((e) => `  error: ${e}`).join("\n"));
  process.exit(1);
}
console.log("validate-google-ads-config: OK");
console.log("  Plausible (si activé): créer les goals « Demo CTA Click » et « Phone Click » dans le dashboard.");
