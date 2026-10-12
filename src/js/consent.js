(function () {
  const STORAGE_KEY = 'aps_consent_v2';
  const LEGACY_KEY = 'aps_consent_v1';
  const cfg = window.__APS_SITE__ || {};

  function readChoice() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(LEGACY_KEY);
        if (raw) {
          const legacy = JSON.parse(raw);
          const migrated = {
            analytics: !!legacy.analytics,
            marketing: !!legacy.marketing,
            ts: legacy.ts || Date.now()
          };
          saveChoice(migrated);
          return migrated;
        }
      }
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch (_) { /* ignore */ }
  }

  function updateConsent(choice) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', {
      ad_storage: choice.marketing ? 'granted' : 'denied',
      ad_user_data: choice.marketing ? 'granted' : 'denied',
      ad_personalization: choice.marketing ? 'granted' : 'denied',
      analytics_storage: choice.analytics ? 'granted' : 'denied'
    });
  }

  function loadPlausible() {
    if (!cfg.plausibleDomain || document.querySelector('script[data-plausible]')) return;
    const s = document.createElement('script');
    s.defer = true;
    s.dataset.plausible = 'true';
    s.dataset.domain = cfg.plausibleDomain;
    s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
  }

  function loadGoogleAds() {
    const id = cfg.googleAdsId;
    if (!id || !/^AW-\d+$/.test(id) || document.querySelector('script[data-gtag-ads]')) return;
    const loader = document.createElement('script');
    loader.async = true;
    loader.dataset.gtagAds = 'true';
    loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(loader);
    loader.addEventListener('load', function () {
      gtag('js', new Date());
      gtag('config', id);
    });
  }

  function setBannerVisible(visible) {
    document.body.classList.toggle('has-consent-banner', visible);
  }

  function hideBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) banner.hidden = true;
    setBannerVisible(false);
  }

  function applyChoice(choice) {
    updateConsent(choice);
    if (choice.analytics) loadPlausible();
    if (choice.marketing) loadGoogleAds();
    hideBanner();
  }

  function persistAndApply(analytics, marketing) {
    const choice = { analytics: analytics, marketing: marketing, ts: Date.now() };
    saveChoice(choice);
    applyChoice(choice);
  }

  function openBanner() {
    const banner = document.getElementById('consent-banner');
    if (!banner) return;
    banner.hidden = false;
    setBannerVisible(true);
  }

  const banner = document.getElementById('consent-banner');
  if (banner) {
    banner.addEventListener('click', function (e) {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.id === 'consent-accept') persistAndApply(true, true);
      else if (t.id === 'consent-analytics') persistAndApply(true, false);
      else if (t.id === 'consent-reject') persistAndApply(false, false);
    });
  }

  document.querySelectorAll('.js-consent-manage').forEach(function (btn) {
    btn.addEventListener('click', openBanner);
  });

  window.__APS_OPEN_CONSENT__ = openBanner;

  const existing = readChoice();
  if (existing) {
    applyChoice(existing);
  } else {
    openBanner();
  }
})();
