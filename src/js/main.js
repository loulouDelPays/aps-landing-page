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

      document.getElementById('kNet').textContent = fmtEUR(net);
      document.getElementById('kNet').dataset.value = net;
      document.getElementById('kNetSub').textContent =
        `${fmtH(hoursSaved)} r\u00e9cup\u00e9r\u00e9es (${fmtEUR(timeValueSaved)}) + ${fmtEUR(marginValue)} de marge \u2212 ${fmtEUR(abo)} d'abo`;

      const minGagneesHintEl = document.getElementById('minGagneesHint');
      if (minGagneesHintEl) {
        minGagneesHintEl.textContent = (minGagnees > 0)
          ? `Soit ${minGagnees.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} min gagn\u00e9es par dossier.`
          : `Aucun gain de temps avec ces valeurs : le temps \u00ab avec APS \u00bb doit \u00eatre inf\u00e9rieur au temps actuel.`;
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
      if (typeof updateRoiCta === 'function') updateRoiCta();
    }

    function resetDefaults(){
      document.getElementById('dossiers').value = 80;
      document.getElementById('minAvant').value = 30;
      document.getElementById('minApres').value = 10;
      document.getElementById('tauxHoraire').value = 35;
      document.getElementById('margeParDossier').value = 30;
      document.getElementById('abo').value = 150;
      document.getElementById('install').value = 850;
      document.querySelectorAll('.roi-preset').forEach(b => b.classList.remove('active'));
      document.querySelector('.roi-preset[data-avant="30"]').classList.add('active');
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

    function updateRoiCta(){
      const roiCta = document.getElementById('roi-cta-demo');
      if (roiCta) roiCta.textContent = 'Tester APS sur un de mes dossiers';
    }

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
