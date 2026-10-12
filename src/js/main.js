    const fmtEUR = (n) => Number(n || 0).toLocaleString('fr-FR', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
    const fmtH = (n) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits:1 }) + ' h';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function recalc(){
      const dossiers = Number(document.getElementById('dossiers').value || 0);
      const minAvant = Number(document.getElementById('minAvant').value || 0);
      const minApres = Number(document.getElementById('minApres').value || 0);
      const tauxHoraire = Number(document.getElementById('tauxHoraire').value || 0);
      const margeParDossier = Number(document.getElementById('margeParDossier').value || 0);
      const abo = Number(document.getElementById('abo').value || 0);
      const install = Number(document.getElementById('install').value || 0);

      const minGagnees = Math.max(0, minAvant - minApres);
      const hoursSaved = (dossiers * minGagnees) / 60;
      const timeValueSaved = hoursSaved * tauxHoraire;
      const marginValue = dossiers * margeParDossier;
      const net = timeValueSaved + marginValue - abo;
      const netAnnual = net * 12;
      const paybackMonths = (install > 0 && net > 0) ? (install / net) : null;

      const netFormatted = fmtEUR(net);
      document.getElementById('kNet').textContent = netFormatted;
      document.getElementById('kNet').dataset.value = net;
      document.querySelectorAll('[data-roi-mirror="kNet"]').forEach((el) => {
        el.textContent = netFormatted;
      });
      document.getElementById('kNetSub').textContent =
        `${fmtH(hoursSaved)} de travail économisées (${fmtEUR(timeValueSaved)}) + ${fmtEUR(marginValue)} de marge supplémentaire estimée \u2212 ${fmtEUR(abo)} d'abonnement`;

      const minGagneesHintEl = document.getElementById('minGagneesHint');
      if (minGagneesHintEl) {
        minGagneesHintEl.textContent = (minGagnees > 0)
          ? `Soit ${minGagnees.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} min de recherche fournisseurs économisées par dossier.`
          : `Aucun temps économisé avec ces valeurs : le temps de recherche avec APS doit être inférieur au temps actuel.`;
      }

      document.getElementById('kNetAnnual').textContent = fmtEUR(netAnnual);
      const paybackEl = document.getElementById('kPayback');
      if (paybackMonths === null) {
        paybackEl.textContent = '\u2014';
      } else {
        paybackEl.textContent = (paybackMonths < 1)
          ? `≈ ${Math.round(paybackMonths * 30)} jours`
          : `≈ ${paybackMonths.toLocaleString('fr-FR', { maximumFractionDigits:1 })} mois`;
      }
    }

    function inputDefaultValue(id) {
      const el = document.getElementById(id);
      if (!el) return '';
      if (el.defaultValue !== undefined && el.defaultValue !== '') return el.defaultValue;
      return el.getAttribute('value') || '';
    }

    function resetDefaults(){
      document.getElementById('dossiers').value = inputDefaultValue('dossiers');
      document.getElementById('minAvant').value = inputDefaultValue('minAvant');
      document.getElementById('minApres').value = inputDefaultValue('minApres');
      document.getElementById('tauxHoraire').value = inputDefaultValue('tauxHoraire');
      document.getElementById('margeParDossier').value = inputDefaultValue('margeParDossier');
      document.getElementById('abo').value = inputDefaultValue('abo');
      document.getElementById('install').value = inputDefaultValue('install');
      document.querySelectorAll('.roi-preset').forEach(b => b.classList.remove('active'));
      const defaultPreset = document.querySelector('.roi-preset[data-default]');
      if (defaultPreset) defaultPreset.classList.add('active');
      recalc();
    }

    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
      btnReset.addEventListener('click', resetDefaults);
      document.querySelectorAll('.roi-preset').forEach(btn => {
        btn.addEventListener('click', function(){
          document.querySelectorAll('.roi-preset').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          document.getElementById('minAvant').value = this.dataset.avant;
          document.getElementById('minApres').value = this.dataset.apres;
          document.getElementById('margeParDossier').value = this.dataset.marge;
          recalc();
        });
      });
      ['dossiers','minAvant','minApres','tauxHoraire','margeParDossier','abo','install'].forEach(id=>{
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', recalc);
      });
      recalc();
    }

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const ACQ_PARAMS = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'gclid', 'gbraid', 'wbraid'
    ];
    const ACQ_STORAGE_KEY = 'aps_acq_params_v1';

    function persistAcqFromUrl() {
      try {
        const incoming = new URLSearchParams(window.location.search);
        const stored = JSON.parse(sessionStorage.getItem(ACQ_STORAGE_KEY) || '{}');
        let changed = false;
        ACQ_PARAMS.forEach(function(key) {
          const value = incoming.get(key);
          if (value) {
            stored[key] = value;
            changed = true;
          }
        });
        if (changed) sessionStorage.setItem(ACQ_STORAGE_KEY, JSON.stringify(stored));
      } catch (_) { /* ignore */ }
    }

    function getAcqParams() {
      const merged = {};
      try {
        Object.assign(merged, JSON.parse(sessionStorage.getItem(ACQ_STORAGE_KEY) || '{}'));
      } catch (_) { /* ignore */ }
      const pageParams = new URLSearchParams(window.location.search);
      ACQ_PARAMS.forEach(function(key) {
        const value = pageParams.get(key);
        if (value) merged[key] = value;
      });
      return merged;
    }

    function appendAcqParams(rawUrl) {
      try {
        const target = new URL(rawUrl, window.location.href);
        const acq = getAcqParams();
        ACQ_PARAMS.forEach(function(key) {
          if (acq[key]) target.searchParams.set(key, acq[key]);
        });
        return target.toString();
      } catch (_) {
        return rawUrl;
      }
    }

    persistAcqFromUrl();

    function initDemoCtaLinks() {
      document.querySelectorAll('.js-demo-cta').forEach(function(link) {
        const baseHref = link.getAttribute('href');
        if (baseHref) link.setAttribute('href', appendAcqParams(baseHref));
        link.addEventListener('click', function() {
          const placement = link.dataset.demoPlacement || 'unknown';
          link.setAttribute('aria-busy', 'true');
          if (typeof window.plausible === 'function') {
            window.plausible('Demo CTA Click', { props: { placement: placement } });
          }
        });
      });
    }
    initDemoCtaLinks();

    function initPhoneCtaLinks() {
      document.querySelectorAll('.js-phone-cta').forEach(function(link) {
        link.addEventListener('click', function() {
          const placement = link.dataset.phonePlacement || 'unknown';
          if (typeof window.plausible === 'function') {
            window.plausible('Phone Click', { props: { placement: placement } });
          }
        });
      });
    }
    initPhoneCtaLinks();

    function initAdsStickyCta() {
      const bar = document.querySelector('body.page-ads .bottom-cta');
      const heroCta = document.getElementById('ads-hero-cta');
      const finalCta = document.querySelector('.final-cta');
      if (!bar || !heroCta || !('IntersectionObserver' in window)) return;
      let heroVisible = true;
      let finalVisible = false;
      function syncSticky() {
        const show = !heroVisible && !finalVisible;
        bar.classList.toggle('is-visible', show);
        document.body.classList.toggle('has-sticky-cta', show);
      }
      const heroObs = new IntersectionObserver(function(entries) {
        heroVisible = entries[0].isIntersecting;
        syncSticky();
      }, { threshold: 0, rootMargin: '0px 0px -8px 0px' });
      heroObs.observe(heroCta);
      if (finalCta) {
        const finalObs = new IntersectionObserver(function(entries) {
          finalVisible = entries[0].isIntersecting;
          syncSticky();
        }, { threshold: 0.15 });
        finalObs.observe(finalCta);
      }
    }
    initAdsStickyCta();

    function getFocusableElements(container){
      return Array.from(container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null || el === container);
    }

    const videoStage = document.getElementById('video-stage');
    const videoStageMedia = videoStage ? videoStage.querySelector('.video-stage__media') : null;
    const videoStageToggleText = videoStage ? videoStage.querySelector('.video-stage__toggle-text') : null;
    let activeVideo = null;
    let videoStageMarker = null;
    let playGeneration = 0;

    function ensureVideoSources(video) {
      if (!video || video.dataset.sourcesReady === 'true') return;
      let attached = false;
      video.querySelectorAll('source[data-src]').forEach(function(source) {
        if (!source.getAttribute('src') && source.dataset.src) {
          source.setAttribute('src', source.dataset.src);
          attached = true;
        }
      });
      if (video.dataset.src && !video.getAttribute('src')) {
        video.setAttribute('src', video.dataset.src);
        attached = true;
      }
      if (!attached) return;
      video.load();
      video.dataset.sourcesReady = 'true';
    }

    function syncVideoStage() {
      if (!videoStage) return;
      const paused = !activeVideo || activeVideo.paused || activeVideo.ended;
      videoStage.classList.toggle('is-paused', paused);
      if (videoStageToggleText) videoStageToggleText.textContent = paused ? 'Reprendre' : 'Pause';
    }

    function playActiveVideo() {
      if (!activeVideo) return;
      const video = activeVideo;
      const generation = ++playGeneration;
      if (video.ended) video.currentTime = 0;
      videoStage.classList.remove('is-paused');
      if (videoStageToggleText) videoStageToggleText.textContent = 'Pause';
      const pending = video.play();
      if (pending && typeof pending.then === 'function') {
        pending.then(function() {
          if (generation !== playGeneration) video.pause();
          syncVideoStage();
        }).catch(function() {
          syncVideoStage();
        });
      }
    }

    function restoreActiveVideo() {
      if (!activeVideo) return;
      const video = activeVideo;
      const marker = videoStageMarker;
      playGeneration += 1;
      video.pause();
      if (marker && marker.parentNode) marker.replaceWith(video);
      activeVideo = null;
      videoStageMarker = null;
      document.body.classList.remove('is-video-open');
      syncVideoStage();
    }

    function toggleActiveVideo() {
      if (!activeVideo) return;
      if (activeVideo.paused || activeVideo.ended) playActiveVideo();
      else {
        playGeneration += 1;
        activeVideo.pause();
        syncVideoStage();
      }
    }

    function openVideoStage(wrap) {
      if (!videoStage || !videoStageMedia || !wrap) return;
      const video = wrap.querySelector('video');
      if (!video) return;
      if (activeVideo === video && videoStage.open) return;
      if (videoStage.open) videoStage.close();
      ensureVideoSources(video);
      videoStageMarker = document.createComment('video-stage');
      video.before(videoStageMarker);
      videoStageMedia.appendChild(video);
      activeVideo = video;
      document.body.classList.add('is-video-open');
      videoStage.showModal();
      playActiveVideo();
    }

    function initVideoPlayer(id) {
      const wrap = document.getElementById(id);
      if (!wrap || !videoStage) return;
      const video = wrap.querySelector('video');
      const playBtn = wrap.querySelector('.play-btn');
      if (!video || !playBtn) return;

      function onState() {
        if (activeVideo === video) syncVideoStage();
      }
      video.addEventListener('play', onState);
      video.addEventListener('pause', onState);
      video.addEventListener('ended', onState);

      playBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openVideoStage(wrap);
      });
      wrap.addEventListener('click', function(e) {
        if (e.target === playBtn || playBtn.contains(e.target)) return;
        openVideoStage(wrap);
      });
    }

    if (videoStage && videoStageMedia) {
      videoStage.querySelector('.video-stage__toggle').addEventListener('click', toggleActiveVideo);
      videoStage.querySelector('.video-stage__close').addEventListener('click', function() {
        videoStage.close();
      });
      videoStageMedia.addEventListener('click', toggleActiveVideo);
      videoStage.addEventListener('click', function(e) {
        if (e.target === videoStage) videoStage.close();
      });
      videoStage.addEventListener('close', restoreActiveVideo);
      videoStage.addEventListener('keydown', function(e) {
        if (e.key !== ' ' && e.code !== 'Space') return;
        if (e.target.closest('.video-stage__close')) return;
        e.preventDefault();
        toggleActiveVideo();
      });
    }

    document.querySelector('.play-hero-demo')?.addEventListener('click', function(e) {
      e.preventDefault();
      const wrap = document.getElementById('hero-player');
      if (!wrap) return;
      wrap.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      openVideoStage(wrap);
    });

    initVideoPlayer('hero-player');
    initVideoPlayer('testimonial-player');

    /* Hamburger menu */
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavLinks = mobileNav ? mobileNav.querySelectorAll('a') : [];
    let mobileNavFocusTrap = null;
    let mobileNavLastFocus = null;

    function trapFocusInContainer(container, e){
      const focusable = getFocusableElements(container);
      if (hamburger && !focusable.includes(hamburger)) focusable.unshift(hamburger);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.key === 'Escape') closeMobileNav();
    }

    function setMobileNavOpen(isOpen){
      if (!hamburger || !mobileNav) return;
      hamburger.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      hamburger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
      mobileNav.classList.toggle('is-open', isOpen);
      mobileNav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      mobileNavLinks.forEach(function(link){
        link.tabIndex = isOpen ? 0 : -1;
      });
      if (isOpen) {
        mobileNavLastFocus = document.activeElement;
        mobileNavFocusTrap = function(e){ trapFocusInContainer(mobileNav, e); };
        document.addEventListener('keydown', mobileNavFocusTrap);
        const firstLink = mobileNav.querySelector('a');
        if (firstLink) firstLink.focus();
      } else {
        if (mobileNavFocusTrap) {
          document.removeEventListener('keydown', mobileNavFocusTrap);
          mobileNavFocusTrap = null;
        }
        if (mobileNavLastFocus && typeof mobileNavLastFocus.focus === 'function') {
          mobileNavLastFocus.focus();
        } else {
          hamburger.focus();
        }
      }
    }
    function closeMobileNav(){ setMobileNavOpen(false); }
    if (hamburger && mobileNav) {
      setMobileNavOpen(false);
      hamburger.addEventListener('click', function(){
        setMobileNavOpen(!hamburger.classList.contains('is-open'));
      });
      mobileNavLinks.forEach(function(link){
        link.addEventListener('click', closeMobileNav);
      });
    }

    /* Scroll reveal */
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.u-reveal').forEach(function(el){ revealObserver.observe(el); });
    } else {
      document.querySelectorAll('.u-reveal').forEach(function(el){ el.classList.add('is-visible'); });
    }

    /* Counter animation */
    function animateCounter(el, target, duration){
      if (prefersReducedMotion) {
        el.textContent = target.toLocaleString('fr-FR');
        return;
      }
      el.textContent = '0';
      const start = performance.now();
      function step(now){
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased).toLocaleString('fr-FR');
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.target || 0);
          animateCounter(el, target, prefersReducedMotion ? 0 : 1400);
          counterObserver.unobserve(el);
        });
      }, { threshold: 0.5 });
      document.querySelectorAll('.counter').forEach(function(el){ counterObserver.observe(el); });
    }
