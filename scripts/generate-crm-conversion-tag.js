#!/usr/bin/env node
/**
 * Génère scripts/crm-conversion-tag.generated.html à partir de site.json + variables d'environnement.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(fs.readFileSync(path.join(root, "src/_data/site.json"), "utf8"));
const id = (process.env.GOOGLE_ADS_ID || site.googleAdsId || "AW-XXXXXXXXX").trim();
const label = (process.env.GOOGLE_ADS_CONVERSION_LABEL || site.googleAdsConversionLabel || "CONVERSION_LABEL").trim();
const out = path.join(root, "scripts/crm-conversion-tag.generated.html");

const html = `<!--
  Généré par npm run generate:crm-tag — ne pas éditer à la main.
  Page de CONFIRMATION CRM uniquement, après réservation validée.
-->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  gtag('js', new Date());
  gtag('config', '${id}', { allow_enhanced_conversions: true });

  function apsReadMarketingConsent() {
    try {
      var raw = localStorage.getItem('aps_consent_v2') || localStorage.getItem('aps_consent_v1');
      if (!raw) return false;
      var c = JSON.parse(raw);
      return !!(c && c.marketing);
    } catch (e) { return false; }
  }

  function apsApplyAdsConsent() {
    if (!apsReadMarketingConsent()) return;
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }

  apsApplyAdsConsent();
  window.addEventListener('storage', function (e) {
    if (e.key === 'aps_consent_v2' || e.key === 'aps_consent_v1') apsApplyAdsConsent();
  });

  function apsFireDemoBookedConversion() {
    if (!apsReadMarketingConsent()) return;
    if (window.__apsDemoBookedFired) return;
    window.__apsDemoBookedFired = true;
    gtag('event', 'conversion', {
      send_to: '${id}/${label}',
      value: 1.0,
      currency: 'EUR'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apsFireDemoBookedConversion);
  } else {
    apsFireDemoBookedConversion();
  }
</script>
`;

fs.writeFileSync(out, html);
console.log(`generate-crm-conversion-tag: ${path.relative(root, out)} (id=${id})`);
