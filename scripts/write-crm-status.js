#!/usr/bin/env node
/**
 * Vérifie que la page CRM demo répond. Les créneaux sont chargés côté client (SPA) :
 * le HTML initial contient souvent « Aucun créneau disponible pour le moment » avant hydratation —
 * ne pas l'utiliser comme signal fiable.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitePath = path.join(root, "src/_data/site.json");
const outPath = path.join(root, "src/_data/crmStatus.json");
const site = JSON.parse(fs.readFileSync(sitePath, "utf8"));
const demoBase = site.demoUrl || "https://crm.aps-logiciel.fr/demo";

function isDemoBookingShell(html) {
  return (
    /demo-booking/i.test(html) &&
    (/VOS INFORMATIONS|Confirmer la demande|CHOISISSEZ UN JOUR/i.test(html) ||
      /demo-booking-page/i.test(html))
  );
}

/** @returns {Promise<{ slotsAvailable: boolean | null, demoPageOk: boolean, httpOk: boolean, checkedAt: string, demoUrl: string, slotsDetection: string }>} */
export async function fetchCrmStatus(demoUrl = demoBase) {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(demoUrl, { redirect: "follow" });
    const html = await res.text();
    const demoPageOk = res.ok && html.trim() && isDemoBookingShell(html);
    return {
      // null = inconnu (SPA) ; pas de bandeau fallback sur la landing
      slotsAvailable: demoPageOk ? null : false,
      demoPageOk,
      httpOk: res.ok,
      checkedAt,
      demoUrl,
      slotsDetection: "client-side",
    };
  } catch {
    return {
      slotsAvailable: null,
      demoPageOk: false,
      httpOk: false,
      checkedAt,
      demoUrl,
      slotsDetection: "unreachable",
      unreachable: true,
    };
  }
}

async function main() {
  const status = await fetchCrmStatus();
  fs.writeFileSync(outPath, JSON.stringify(status, null, 2) + "\n");
  console.log(
    `write-crm-status: demoPageOk=${status.demoPageOk} slots=${status.slotsAvailable === null ? "client-side (OK)" : status.slotsAvailable} → ${path.relative(root, outPath)}`
  );
  if (!status.demoPageOk) {
    console.warn("write-crm-status: page CRM demo inaccessible ou inattendue — vérifier manuellement.");
  }
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  await main();
}
