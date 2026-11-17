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

    function getDemoBaseUrl() {
      return (window.__APS_SITE__ && window.__APS_SITE__.demoUrl) || 'https://crm.aps-logiciel.fr/demo';
    }

    function isDemoBookingHref(href) {
      if (!href) return false;
      try {
        const target = new URL(href, window.location.href);
        const demo = new URL(getDemoBaseUrl(), window.location.href);
        const normPath = function(path) {
          return path.replace(/\/$/, '') || '/';
        };
        return target.origin === demo.origin && normPath(target.pathname) === normPath(demo.pathname);
      } catch (_) {
        return false;
      }
    }

    function buildDemoBookingUrl(rawUrl) {
      try {
        const target = new URL(rawUrl, window.location.href);
        const acq = getAcqParams();
        ACQ_PARAMS.forEach(function(key) {
          if (acq[key]) target.searchParams.set(key, acq[key]);
        });
        target.searchParams.set('origine', 'site');
        target.searchParams.set('retour', window.location.href);
        return target.toString();
      } catch (_) {
        return rawUrl;
      }
    }

    function normalizeDemoLinkRel(link) {
      const rel = (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      const filtered = rel.filter(function(token) {
        return token.toLowerCase() !== 'noreferrer';
      });
      if (link.target === '_blank' && filtered.indexOf('noopener') === -1) {
        filtered.push('noopener');
      }
      if (filtered.length) link.setAttribute('rel', filtered.join(' '));
      else link.removeAttribute('rel');
    }

    function applyDemoLinkHref(link) {
      const baseHref = link.getAttribute('href');
      if (!baseHref || !isDemoBookingHref(baseHref)) return;
      link.setAttribute('href', buildDemoBookingUrl(baseHref));
      normalizeDemoLinkRel(link);
    }

    persistAcqFromUrl();

    function initDemoCtaLinks() {
      document.querySelectorAll('a[href]').forEach(function(link) {
        if (!isDemoBookingHref(link.getAttribute('href'))) return;
        applyDemoLinkHref(link);
        link.addEventListener('pointerenter', function() {
          applyDemoLinkHref(link);
        });
        link.addEventListener('pointerdown', function() {
          applyDemoLinkHref(link);
        });
        if (link.classList.contains('js-demo-cta')) {
          link.addEventListener('click', function() {
            applyDemoLinkHref(link);
            const placement = link.dataset.demoPlacement || 'unknown';
            link.setAttribute('aria-busy', 'true');
            if (typeof window.plausible === 'function') {
              window.plausible('Demo CTA Click', { props: { placement: placement } });
            }
          });
        }
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

    function buildCallbackAcquisition() {
      const acq = getAcqParams();
      const payload = {
        fromCommercialSite: true,
        landingPath: window.location.pathname,
        device: window.matchMedia('(max-width: 980px)').matches ? 'mobile' : 'desktop'
      };
      ACQ_PARAMS.forEach(function(key) {
        if (acq[key]) payload[key] = acq[key];
      });
      return payload;
    }

    function getFocusableElements(container){
      return Array.from(container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null || el === container);
    }

    let closeCallbackModal = null;
    let callbackModalSession = 0;

    const CALLBACK_FIELD_NAMES = [
      'contactFirstName',
      'contactLastName',
      'companyName',
      'contactPhone',
      'contactEmail',
      'consent'
    ];

    function getNamedFormValue(form, name) {
      const el = form.elements.namedItem(name);
      if (!el) return '';
      if (typeof el.value === 'string') return el.value.trim();
      return '';
    }

    function normalizePhoneCompact(value) {
      return String(value || '').replace(/[\s.\-()]/g, '');
    }

    function isValidFrenchPhone(value) {
      const compact = normalizePhoneCompact(value);
      if (compact.length > 50) return false;
      if (/^0[1-9]\d{8}$/.test(compact)) return true;
      if (/^(\+33|0033)[1-9]\d{8}$/.test(compact)) return true;
      return false;
    }

    function isValidCallbackEmail(value) {
      const v = value.trim();
      if (v.length > 255) return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function getCallbackFieldError(form, name) {
      const el = form.elements.namedItem(name);
      if (!el) return '';
      if (name === 'consent') {
        return el.checked ? '' : 'Cochez cette case pour être rappelé.';
      }
      const val = typeof el.value === 'string' ? el.value.trim() : '';
      if (name === 'contactFirstName') {
        if (!val) return 'Le prénom est requis';
        if (val.length > 255) return '255 caractères maximum';
        return '';
      }
      if (name === 'contactLastName') {
        if (!val) return 'Le nom est requis';
        if (val.length > 255) return '255 caractères maximum';
        return '';
      }
      if (name === 'companyName') {
        if (!val) return 'Le nom de la société est requis';
        if (val.length > 255) return '255 caractères maximum';
        return '';
      }
      if (name === 'contactEmail') {
        if (!val) return 'L\'email est requis';
        if (!isValidCallbackEmail(val)) return 'Format d\'email invalide';
        return '';
      }
      if (name === 'contactPhone') {
        if (!val) return 'Le téléphone est requis';
        if (!isValidFrenchPhone(val)) {
          return 'Indiquez un numéro à 10 chiffres, par exemple 06 12 34 56 78.';
        }
        return '';
      }
      return '';
    }

    function collectCallbackValidationErrors(form) {
      const errors = [];
      CALLBACK_FIELD_NAMES.forEach(function(name) {
        const message = getCallbackFieldError(form, name);
        if (message) errors.push({ name: name, message: message });
      });
      return errors;
    }

    function setCallbackFieldError(form, name, message) {
      const control = form.elements.namedItem(name);
      if (!control) return;
      const field = control.closest('.field');
      const errId = control.getAttribute('aria-describedby');
      const errEl = errId ? document.getElementById(errId) : (field && field.querySelector('.field-error'));
      if (field) field.classList.add('is-invalid');
      control.setAttribute('aria-invalid', 'true');
      if (errEl) {
        errEl.textContent = message;
        errEl.hidden = false;
      }
    }

    function clearCallbackFieldError(form, name) {
      const control = form.elements.namedItem(name);
      if (!control) return;
      const field = control.closest('.field');
      const errId = control.getAttribute('aria-describedby');
      const errEl = errId ? document.getElementById(errId) : (field && field.querySelector('.field-error'));
      if (field) field.classList.remove('is-invalid');
      control.removeAttribute('aria-invalid');
      if (errEl) {
        errEl.textContent = '';
        errEl.hidden = true;
      }
    }

    function clearAllCallbackFieldErrors(form) {
      CALLBACK_FIELD_NAMES.forEach(function(name) {
        clearCallbackFieldError(form, name);
      });
    }

    function applyCallbackApiFieldErrors(form, data) {
      const details = data && data.error && data.error.details;
      const msg = (data && data.error && data.error.message) || '';
      if (!details || typeof details !== 'object' || Array.isArray(details)) {
        return msg || 'Vérifiez les champs du formulaire.';
      }
      const unmapped = [];
      Object.keys(details).forEach(function(key) {
        const v = details[key];
        const line = Array.isArray(v) ? (v[0] || '') : String(v || '');
        if (!line) return;
        if (CALLBACK_FIELD_NAMES.indexOf(key) >= 0 && form.elements.namedItem(key)) {
          setCallbackFieldError(form, key, line);
        } else {
          unmapped.push(line);
        }
      });
      if (unmapped.length) return (msg ? msg + ' ' : '') + unmapped.join(' ');
      return '';
    }

    function initCallbackForms() {
      const forms = document.querySelectorAll('.js-callback-form');
      if (!forms.length) return;
      const endpoint = (window.__APS_SITE__ && window.__APS_SITE__.callbackRequestUrl) ||
        'https://crm.aps-logiciel.fr/api/public/callback-requests';
      const phoneFallback = (window.__APS_SITE__ && window.__APS_SITE__.phoneDisplay) || '06 58 81 67 37';

      forms.forEach(function(form) {
        const statusEl = form.querySelector('.callback-form-status');
        const submitBtn = form.querySelector('.callback-form-submit');

        function setStatus(message, isError) {
          if (!statusEl) return;
          statusEl.textContent = message;
          statusEl.hidden = !message;
          statusEl.classList.toggle('callback-form-status--error', Boolean(isError));
        }

        CALLBACK_FIELD_NAMES.forEach(function(name) {
          const control = form.elements.namedItem(name);
          if (!control) return;
          const eventName = name === 'consent' ? 'change' : 'input';
          control.addEventListener(eventName, function() {
            clearCallbackFieldError(form, name);
          });
          if (name !== 'consent') {
            control.addEventListener('change', function() {
              clearCallbackFieldError(form, name);
            });
          }
        });

        form.addEventListener('submit', function(e) {
          e.preventDefault();
          setStatus('', false);
          clearAllCallbackFieldErrors(form);
          const validationErrors = collectCallbackValidationErrors(form);
          if (validationErrors.length) {
            validationErrors.forEach(function(err) {
              setCallbackFieldError(form, err.name, err.message);
            });
            const firstControl = form.elements.namedItem(validationErrors[0].name);
            if (firstControl && typeof firstControl.focus === 'function') {
              firstControl.focus();
            }
            return;
          }
          const hp = form.querySelector('input[name="website"]');
          if (hp && hp.value.trim()) {
            setStatus('Votre demande a bien été enregistrée.', false);
            form.reset();
            clearAllCallbackFieldErrors(form);
            return;
          }
          const placement = form.dataset.callbackPlacement || 'unknown';
          const body = {
            contactFirstName: getNamedFormValue(form, 'contactFirstName'),
            contactLastName: getNamedFormValue(form, 'contactLastName'),
            companyName: getNamedFormValue(form, 'companyName'),
            contactPhone: getNamedFormValue(form, 'contactPhone'),
            contactEmail: getNamedFormValue(form, 'contactEmail'),
            consent: true,
            website: '',
            acquisition: buildCallbackAcquisition()
          };
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
          }
          setStatus('', false);
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }).then(function(res) {
            return res.json().then(function(data) {
              return { res: res, data: data };
            }).catch(function() {
              return { res: res, data: null };
            });
          }).then(function(_ref) {
            const res = _ref.res;
            const data = _ref.data;
            if (res.status === 201) {
              const msg = (data && data.message) || 'Votre demande de rappel a bien été enregistrée.';
              setStatus(msg, false);
              form.reset();
              clearAllCallbackFieldErrors(form);
              if (typeof window.plausible === 'function') {
                window.plausible('Callback Request', {
                  props: { landing: 'ads', placement: placement }
                });
              }
              if (form.id === 'callback-form-modal' && typeof closeCallbackModal === 'function') {
                const sessionAtSubmit = callbackModalSession;
                window.setTimeout(function() {
                  if (sessionAtSubmit === callbackModalSession) closeCallbackModal();
                }, 2400);
              }
              return;
            }
            if (res.status === 403) {
              setStatus('Envoi impossible depuis cette adresse (hors site officiel). Testez sur aps-logiciel.fr ou appelez le ' + phoneFallback + '.', true);
              return;
            }
            if (res.status === 429) {
              setStatus('Trop de demandes depuis cette connexion. Réessayez plus tard ou appelez le ' + phoneFallback + '.', true);
              return;
            }
            if (res.status === 422) {
              const statusMsg = applyCallbackApiFieldErrors(form, data);
              if (statusMsg) setStatus(statusMsg, true);
              const firstInvalid = CALLBACK_FIELD_NAMES.find(function(name) {
                const control = form.elements.namedItem(name);
                return control && control.getAttribute('aria-invalid') === 'true';
              });
              if (firstInvalid) {
                const focusEl = form.elements.namedItem(firstInvalid);
                if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
              }
              return;
            }
            const serverMsg = data && data.error && data.error.message;
            if (serverMsg) {
              setStatus(serverMsg, true);
              return;
            }
            setStatus('Envoi impossible pour le moment. Appelez le ' + phoneFallback + ' ou réessayez plus tard.', true);
          }).catch(function() {
            setStatus('Envoi impossible pour le moment. Appelez le ' + phoneFallback + ' ou réessayez plus tard.', true);
          }).finally(function() {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.removeAttribute('aria-busy');
            }
          });
        });
      });
    }
    function initCallbackModal() {
      const stage = document.getElementById('callback-stage');
      if (!stage) return;
      let lastTrigger = null;

      function openCallbackModal(trigger) {
        lastTrigger = trigger || null;
        callbackModalSession += 1;
        const placement = (trigger && trigger.dataset.callbackPlacement) || 'unknown';
        const modalForm = document.getElementById('callback-form-modal');
        if (modalForm) modalForm.dataset.callbackPlacement = placement;
        if (typeof window.plausible === 'function') {
          window.plausible('Callback Modal Open', { props: { placement: placement } });
        }
        document.body.classList.add('is-callback-open');
        stage.showModal();
        const focusables = getFocusableElements(stage);
        const firstInput = stage.querySelector('input:not([type="hidden"]):not(.callback-honeypot)');
        if (firstInput) firstInput.focus();
        else if (focusables.length) focusables[0].focus();
      }

      closeCallbackModal = function() {
        if (!stage.open) return;
        stage.close();
        document.body.classList.remove('is-callback-open');
        const modalForm = document.getElementById('callback-form-modal');
        if (modalForm) modalForm.dataset.callbackPlacement = 'modal';
        if (lastTrigger && typeof lastTrigger.focus === 'function') {
          lastTrigger.focus();
        }
        lastTrigger = null;
      };

      document.querySelectorAll('.js-callback-trigger').forEach(function(trigger) {
        trigger.addEventListener('click', function() {
          openCallbackModal(trigger);
        });
      });

      stage.querySelectorAll('.js-callback-close').forEach(function(btn) {
        btn.addEventListener('click', function() {
          closeCallbackModal();
        });
      });

      stage.addEventListener('cancel', function(e) {
        e.preventDefault();
        closeCallbackModal();
      });

      stage.addEventListener('click', function(e) {
        if (e.target === stage) closeCallbackModal();
      });
    }
    initCallbackModal();
    initCallbackForms();

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
