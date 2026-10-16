/* ============================================================================
   DaSsk QMS Services — Digital Employee ID Card System
   main.js  ·  Behaviour shared by the landing page and every employee card

   Design note — why this file renders almost no markup:
   All page content is written as real static HTML (by tools/build.mjs from
   assets/js/data.js). That keeps the site fully readable by search engines and
   by visitors with JavaScript disabled, and avoids layout shift. This file only
   adds behaviour and motion on top of markup that already exists.

   There is deliberately no QR code logic here. The printed codes are generated
   manually after deployment from each employee's profile URL.

   Sections
     01  Helpers
     02  Theme (dark / light)
     03  Preloader
     04  Sticky header
     05  Scroll progress bar
     06  Reveal on scroll
     07  Button ripple
     08  Card tilt & pointer glow
     09  Count-up statistics
     10  Scroll-to-top
     11  Toast, share and copy-to-clipboard
     12  Photograph fallback safety net
     13  Employee directory search
     14  Quick employee-ID lookup
     15  Boot
   ========================================================================== */
(function () {
  'use strict';

  /* --- 01 · Helpers ------------------------------------------------------- */
  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(sel));
  }

  var THEME_KEY = 'gmscpl-theme';

  /* Every decorative animation below is skipped for a visitor who has asked
     the operating system to reduce motion. */
  function reducedMotion() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Coarse pointers (phones, tablets) get no hover-driven motion — it either
     never triggers or fires on tap, which feels broken. */
  function finePointer() {
    return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }

  /* --- 02 · Theme --------------------------------------------------------- */
  /* The initial theme is applied by a tiny inline script in each page's <head>
     (before first paint, so there is no flash of the wrong colours). This only
     handles the toggle and keeps the browser UI colour in step. */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0f1c' : '#0f172a');
    $$('[data-action="theme"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function initTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current);

    $$('[data-action="theme"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = (document.documentElement.getAttribute('data-theme') === 'dark')
          ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* private mode */ }
      });
    });

    /* Follow the operating system if the visitor has not chosen explicitly. */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (event) {
        var stored = null;
        try { stored = localStorage.getItem(THEME_KEY); } catch (err) { /* ignore */ }
        if (!stored) applyTheme(event.matches ? 'dark' : 'light');
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* --- 03 · Preloader ----------------------------------------------------- */
  function initPreloader() {
    var loader = $('.preloader');
    if (!loader) return;
    var hide = function () {
      loader.classList.add('is-done');
      window.setTimeout(function () { loader.setAttribute('hidden', ''); }, 600);
    };
    if (document.readyState === 'complete') window.setTimeout(hide, 300);
    else window.addEventListener('load', function () { window.setTimeout(hide, 300); });
    window.setTimeout(hide, 3500);   // safety net if a slow asset never loads
  }

  /* --- 04 · Sticky header ------------------------------------------------- */
  function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- 05 · Scroll progress bar ------------------------------------------ */
  function initScrollProgress() {
    var bar = $('[data-scroll-progress]');
    if (!bar) return;

    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + ratio + ')';
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* --- 06 · Reveal on scroll ---------------------------------------------- */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings so a grid animates in sequence, not all at once.
        var siblings = el.parentElement ? $$('[data-reveal]', el.parentElement) : [el];
        el.style.setProperty('--d', Math.min(siblings.indexOf(el), 8) * 70 + 'ms');
        el.classList.add('is-in');
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* --- 07 · Button ripple ------------------------------------------------- */
  function initRipple() {
    document.addEventListener('pointerdown', function (event) {
      var btn = event.target.closest ? event.target.closest('.btn, .fab') : null;
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (event.clientX - rect.left - size / 2) + 'px';
      span.style.top = (event.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(span);
      window.setTimeout(function () { span.remove(); }, 650);
    });
  }

  /* --- 08 · Card tilt & pointer glow -------------------------------------
     The ID card panel leans towards the cursor, and cards marked
     [data-glow] track the pointer so the highlight follows it. Both are
     decorative: no layout depends on them. */
  function initTilt() {
    if (reducedMotion() || !finePointer()) return;

    $$('[data-tilt]').forEach(function (card) {
      var frame = 0;

      var move = function (event) {
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = 0;
          var rect = card.getBoundingClientRect();
          var x = (event.clientX - rect.left) / rect.width - 0.5;   // -0.5 … 0.5
          var y = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.setProperty('--tilt-x', (y * -7).toFixed(2) + 'deg');
          card.style.setProperty('--tilt-y', (x * 9).toFixed(2) + 'deg');
          card.style.setProperty('--sheen-x', ((x + 0.5) * 100).toFixed(1) + '%');
          card.style.setProperty('--sheen-y', ((y + 0.5) * 100).toFixed(1) + '%');
        });
      };

      var reset = function () {
        if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      };

      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', reset);
      card.classList.add('is-tiltable');
    });

    /* Pointer-following highlight on ordinary cards. */
    $$('.card--hover, .btn--tile, .msg-card').forEach(function (el) {
      el.addEventListener('pointermove', function (event) {
        var rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
        el.style.setProperty('--my', (event.clientY - rect.top) + 'px');
      });
    });
  }

  /* --- 09 · Count-up statistics ------------------------------------------
     Any element with data-count="12" animates 0 → 12 the first time it is
     scrolled into view. The final value is already in the HTML, so it is
     correct without JavaScript and for screen readers. */
  function initCounters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;

    if (reducedMotion() || !('IntersectionObserver' in window)) return;

    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-count-suffix') || '';
      var started = null;
      var duration = 1100;

      var step = function (now) {
        if (started === null) started = now;
        var t = Math.min(1, (now - started) / duration);
        var eased = 1 - Math.pow(1 - t, 3);              // ease-out cubic
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) window.requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };

      window.requestAnimationFrame(step);
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    nodes.forEach(function (el) { observer.observe(el); });
  }

  /* --- 10 · Scroll-to-top ------------------------------------------------- */
  function initScrollTop() {
    var fab = $('[data-action="scroll-top"]');
    if (!fab) return;
    var onScroll = function () { fab.classList.toggle('is-visible', window.scrollY > 420); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    fab.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- 11 · Toast, share and copy ---------------------------------------- */
  function toast(message) {
    var el = $('.toast');
    if (!el) return;
    var text = el.querySelector('[data-toast-text]');
    if (text) text.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }

  /* The address of this page, without a hash or query string. */
  function canonicalUrl() {
    var url = window.location.href.split('#')[0].split('?')[0];
    return url.replace(/\/index\.html$/, '/');
  }

  function copyText(value, okMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(
        function () { toast(okMessage); },
        function () { legacyCopy(value, okMessage); }
      );
      return;
    }
    legacyCopy(value, okMessage);
  }

  /* Older mobile browsers, and any page served without a secure context,
     have no clipboard API — fall back to a hidden textarea. */
  function legacyCopy(value, okMessage) {
    try {
      var area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand && document.execCommand('copy');
      area.remove();
      toast(ok ? okMessage : 'Copy is not available — please select the text manually');
    } catch (err) {
      toast('Copy is not available — please select the text manually');
    }
  }

  function initShare() {
    $$('[data-action="share"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var url = canonicalUrl();
        var title = document.title;
        var descMeta = $('meta[name="description"]');
        var text = descMeta ? descMeta.getAttribute('content') : title;

        if (navigator.share) {
          navigator.share({ title: title, text: text, url: url })
            .catch(function () { /* visitor dismissed the sheet */ });
          return;
        }
        copyText(url, 'Profile link copied to clipboard');
      });
    });

    /* Copy one of the ready-written enquiry messages, for anyone who would
       rather paste it somewhere else. */
    $$('[data-action="copy-message"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyText(btn.getAttribute('data-copy') || '', 'Message copied — paste it anywhere');
      });
    });
  }

  /* --- 12 · Photograph fallback safety net -------------------------------
     Each photo carries an inline onerror that swaps in the branded monogram,
     so it works without JavaScript. This catches the one case that misses:
     an image that had already finished failing before this script ran. */
  function initPhotoFallback() {
    $$('.profile__photo img, .member__photo img').forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        var fallback = img.getAttribute('src').replace(/[^/]+$/, 'avatar.svg');
        if (img.getAttribute('src') !== fallback) {
          img.src = fallback;
          if (img.parentNode) img.parentNode.classList.add('is-fallback');
        }
      }
    });
  }

  /* --- 13 · Employee directory search -----------------------------------
     Filters the static employee cards already in the DOM. Each card carries a
     lower-cased data-search haystack (name, ID, designation, department,
     email, phone) written by the generator. */
  function initDirectorySearch() {
    var input = $('[data-action="filter-team"]');
    if (!input) return;

    var wrap = input.closest('.search');
    var cards = $$('[data-search]');
    var count = $('[data-result-count]');
    var empty = $('.search-empty');
    var clear = $('[data-action="clear-search"]');

    var activeFilter = '';
    var filterButtons = $$('[data-filter]');

    var apply = function () {
      var query = input.value.trim().toLowerCase();
      // Match every whitespace-separated term, so "partner hyderabad" also finds a card.
      var terms = query ? query.split(/\s+/) : [];
      var shown = 0;

      cards.forEach(function (card) {
        var hay = card.getAttribute('data-search') || '';
        var textHit = terms.every(function (term) { return hay.indexOf(term) !== -1; });
        var role = (card.getAttribute('data-designation') || '').toLowerCase();
        var state = (card.getAttribute('data-state') || '').toLowerCase();
        var filterHit = !activeFilter || role === activeFilter || state === activeFilter;
        var hit = textHit && filterHit;
        card.classList.toggle('is-filtered', !hit);
        if (hit) shown++;
      });

      if (count) {
        count.textContent = shown === cards.length
          ? cards.length + ' employees'
          : shown + ' of ' + cards.length + ' employees';
      }
      if (empty) empty.classList.toggle('is-visible', shown === 0);
      if (wrap) wrap.classList.toggle('has-value', query.length > 0);
    };

    input.addEventListener('input', apply);

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeFilter = (btn.getAttribute('data-filter') || '').toLowerCase();
        filterButtons.forEach(function (other) {
          other.classList.toggle('is-on', other === btn);
        });
        apply();
      });
    });

    // Enter with exactly one match opens that card straight away.
    // Target the card link specifically: the first anchor inside a directory
    // card is the tel: shortcut, so a plain 'a[href]' would start a phone call.
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      var visible = cards.filter(function (c) { return !c.classList.contains('is-filtered'); });
      if (visible.length === 1) {
        var link = visible[0].querySelector('[data-card-link]') ||
                   visible[0].querySelector('a.btn--block[href]');
        if (link) window.location.href = link.getAttribute('href');
      }
    });

    if (clear) {
      clear.addEventListener('click', function () {
        input.value = '';
        apply();
        input.focus();
      });
    }

    apply();
  }

  /* --- 14 · Quick employee-ID lookup ------------------------------------
     Accepts 'GMS-P-0001', 'gms-p-0001', '0001', '1' or a name, and opens that
     employee's digital ID card. Uses the shared data file so the lookup never
     drifts from the directory. */
  function initQuickLookup() {
    var form = $('[data-action="quick-lookup"]');
    if (!form) return;

    var input = form.querySelector('input');
    var note = $('[data-lookup-note]');

    var setNote = function (message, isError) {
      if (!note) return;
      note.textContent = message || '';
      note.classList.toggle('is-error', !!isError);
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var raw = (input.value || '').trim();
      var data = window.GMSCPL_DATA || window.DASSK_DATA;
      var example = (data && data.employees && data.employees[0] && data.employees[0].id) || 'GMS-P-0001';
      if (!raw) { setNote('Enter an employee ID, for example ' + example + '.', true); return; }

      var match = resolveEmployee(raw);
      if (!match) {
        setNote('No employee found for "' + raw + '". Try an ID like ' + example + ' or a name.', true);
        return;
      }
      setNote('Opening ' + match.name + ' — ' + match.id + '…', false);
      // index.html is named explicitly so the lookup also works over file://,
      // where a bare folder URL shows a directory listing instead of the page.
      window.location.href = 'employees/' + match.slug + '/index.html';
    });
  }

  /* Resolve a free-text query to one employee. */
  function resolveEmployee(raw) {
    var data = window.GMSCPL_DATA || window.DASSK_DATA;
    if (!data) return null;

    var list = data.all();
    var query = raw.trim().toLowerCase();

    // 1 · exact ID, in any of the shapes people actually type
    var digits = query.replace(/\D/g, '');
    var candidates = [query];
    if (digits) {
      var padded = digits.slice(-4).padStart(4, '0');
      var prefix = ((data.company && data.company.idPrefix) || 'gms-p').toLowerCase();
      candidates.push(prefix + '-' + padded);
    }
    for (var i = 0; i < list.length; i++) {
      if (candidates.indexOf(list[i].slug) !== -1) return list[i];
    }

    // 2 · name / designation contains the query
    for (var j = 0; j < list.length; j++) {
      var hay = (list[j].name + ' ' + list[j].designation + ' ' +
        (list[j].email || '') + ' ' + (list[j].residentState || '')).toLowerCase();
      if (hay.indexOf(query) !== -1) return list[j];
    }
    return null;
  }

  /* --- 15 · Boot ---------------------------------------------------------- */
  function boot() {
    // Stamp the current year in the footer.
    $$('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    initTheme();
    initPreloader();
    initHeader();
    initScrollProgress();
    initReveal();
    initRipple();
    initTilt();
    initCounters();
    initScrollTop();
    initShare();
    initPhotoFallback();
    initDirectorySearch();
    initQuickLookup();
    initPrint();
    initReach();
  }

  /* --- 17 · Phone and WhatsApp -------------------------------------------
     A desktop browser often has no dialer, so tel: appears to do nothing.
     On a computer, Call opens a panel with the number. WhatsApp opens
     WhatsApp Web. A phone still uses the native dialer and the WhatsApp app. */
  function isHandheld() {
    var ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
    return window.matchMedia('(pointer: coarse)').matches &&
      window.matchMedia('(max-width: 900px)').matches;
  }

  function waParts(href) {
    var url;
    try { url = new URL(href, window.location.href); }
    catch (err) { return null; }
    if (!/(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(url.hostname)) return null;
    var phone = (url.searchParams.get('phone') || '').replace(/\D/g, '');
    if (!phone) {
      var bits = url.pathname.split('/').filter(Boolean);
      var last = bits[bits.length - 1] || '';
      if (/^\d{8,15}$/.test(last)) phone = last;
    }
    if (!phone) return null;
    return {
      phone: phone,
      text: url.searchParams.get('text') ||
        'Hello GMSCPL, I would like to enquire about management systems certification.'
    };
  }

  function closeReach() {
    var sheet = document.querySelector('.reach-sheet');
    if (sheet) sheet.remove();
    document.body.classList.remove('has-reach');
  }

  function openReach(number) {
    closeReach();
    var pretty = number.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2');
    var root = document.createElement('div');
    root.className = 'reach-sheet';
    root.innerHTML =
      '<div class="reach-sheet__card" role="dialog" aria-modal="true" aria-labelledby="reach-title">' +
        '<p class="eyebrow">Call</p>' +
        '<h2 id="reach-title">GMSCPL phone</h2>' +
        '<p class="reach-sheet__number">' + pretty + '</p>' +
        '<p class="reach-sheet__note">Copy the number, or open it in a phone app if this computer has one.</p>' +
        '<div class="reach-sheet__actions">' +
          '<button type="button" class="btn" data-reach-copy>Copy number</button>' +
          '<a class="btn btn--ghost" href="tel:' + number + '">Open phone app</a>' +
          '<button type="button" class="btn btn--ghost" data-reach-close>Close</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);
    document.body.classList.add('has-reach');
    root.addEventListener('click', function (event) {
      if (event.target === root || event.target.closest('[data-reach-close]')) closeReach();
      if (event.target.closest('[data-reach-copy]')) copyText(number, 'Copied ' + pretty);
    });
  }

  function initReach() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href]');
      if (!link || link.closest('.reach-sheet')) return;
      var href = link.getAttribute('href') || '';

      if (href.indexOf('tel:') === 0) {
        if (isHandheld()) return;
        event.preventDefault();
        openReach(decodeURIComponent(href.slice(4)));
        return;
      }

      var wa = waParts(href);
      if (!wa) return;
      event.preventDefault();
      var text = encodeURIComponent(wa.text);
      var appUrl = 'https://wa.me/' + wa.phone + '?text=' + text;
      var webUrl = 'https://web.whatsapp.com/send?phone=' + wa.phone + '&text=' + text;
      if (isHandheld()) {
        window.location.href = appUrl;
        return;
      }
      var opened = window.open(webUrl, '_blank', 'noopener');
      if (!opened) window.location.href = webUrl;
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeReach();
    });
  }

  /* --- 16 · Employee-details PDF -----------------------------------------
     Opens the browser print dialog so the visitor can save the card as PDF.
     The print stylesheet keeps the employee record and drops the chrome. */
  function initPrint() {
    $$('[data-action="print"]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.print(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Exposed for debugging and for anything added later.
  window.GMSCPLSite = window.DasskSite = {
    toast: toast,
    copyText: copyText,
    resolveEmployee: resolveEmployee,
    canonicalUrl: canonicalUrl
  };
}());
