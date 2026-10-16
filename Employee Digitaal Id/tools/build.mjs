/* ============================================================================
   GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED (GMSCPL)
   tools/build.mjs  ·  Static page generator
   ----------------------------------------------------------------------------
   Reads assets/js/data.js (the single source of truth) and writes, for every
   employee:

     employees/<id>/index.html   full digital ID card page (static HTML)
     employees/<id>/contact.vcf  contact file for the "Save Contact" button
     employees/<id>/avatar.svg   branded monogram, always written — it is the
                                 fallback shown when a photograph is missing
                                 or fails to load in the browser

   PHOTOGRAPHS
     Drop the employee's photo straight into their folder under any file name
     (.jpg .jpeg .png .webp .avif). This script finds it and wires it into the
     page, the vCard and the structured data. If a folder holds more than one
     image, set `photo` on that employee in data.js to pin the right one.

   NO QR CODES
     QR codes are produced manually after deployment from each employee's
     profile URL (printed by this script at the end of a run). Nothing on the
     site renders, downloads or prints a code.

   It also refreshes the generated regions of index.html (between the BUILD:
   markers) and rewrites sitemap.xml.

   Run:  node tools/build.mjs

   Why generate static HTML instead of rendering in the browser?
     · search engines and link previews see the real content
     · the card still works with JavaScript disabled
     · no layout shift, so Lighthouse stays high
   The generated site itself contains no Node.js and no build step — it is
   plain HTML/CSS/JS that runs directly on GitHub Pages.
   ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const require = createRequire(import.meta.url);

/* data.js and icons.js are written to work in both the browser and Node. */
const DATA = require(join(ROOT, 'assets/js/data.js'));
const ICONS = require(join(ROOT, 'assets/js/icons.js'));

const { company: CO } = DATA;
const icon = (name, cls) => ICONS.svg(name, cls);

/* --- Small utilities ------------------------------------------------------ */
const esc = (v) => String(v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const write = (relativePath, contents) => {
  const full = join(ROOT, relativePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents, 'utf8');
  return relativePath;
};

/* Absolute URL for canonical tags, OG images and the sitemap. */
const absolute = (path = '') =>
  CO.origin + CO.basePath + String(path).replace(/^\//, '');

/* Link to an employee's card.

   Internal links name index.html explicitly rather than ending at the folder.
   A bare 'employees/gms-p-0001/' only resolves to the page when a web server
   is there to pick the directory index; opened straight off disk over file://
   the browser shows a listing of the folder instead. Naming the file works in
   all three cases — file://, any local server, and GitHub Pages — and the
   pretty directory form is still what canonical tags, the sitemap, the vCards
   and the printed QR codes use. */
const cardHref = (root, slug) => `${root}employees/${slug}/index.html`;

/* --- Photograph discovery ------------------------------------------------
   The whole point is that whoever maintains the site just drops a photo into
   the employee's folder. We look for one and use it; the generated monogram
   stays behind it as the fallback. */
const PHOTO_EXT = /\.(jpe?g|png|webp|avif)$/i;
const photoReport = [];

function findPhoto(employee) {
  const dir = join(ROOT, 'employees', employee.slug);
  if (!existsSync(dir)) return null;

  const images = readdirSync(dir)
    .filter((f) => PHOTO_EXT.test(f))
    .sort((a, b) => a.localeCompare(b));

  if (!images.length) return null;

  /* An explicit `photo` in data.js wins — matched case-insensitively so a
     Windows-typed 'kasthuri.jpeg' still resolves to the real 'Kasthuri.jpeg'
     on GitHub Pages, which is case-sensitive. */
  if (employee.hasPhoto) {
    const wanted = String(employee.photo).toLowerCase();
    const exact = images.find((f) => f.toLowerCase() === wanted);
    if (exact) return exact;
    photoReport.push(`! ${employee.id}: data.js asks for "${employee.photo}" but the ` +
      `folder holds ${images.map((f) => `"${f}"`).join(', ')} — using "${images[0]}"`);
  }
  return images[0];
}

/* File names go into HTML attributes and a vCard URI, so encode them — a
   photo saved as "John Doe.jpg" must not break the URL. */
const encodeFile = (name) => encodeURIComponent(name).replace(/%2F/gi, '/');

/* --- Shared page fragments ----------------------------------------------
   `root` is the relative path back to the site root: '' on the landing page,
   '../../' inside an employee folder. */

/* Applied before first paint so the correct theme is painted immediately —
   no flash of light content for a visitor who prefers dark. */
const themeBootScript = `<script>
/* Theme must be set before first paint — keep this inline. */
(function(){try{var s=localStorage.getItem('gmscpl-theme');
var d=s||((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');
document.documentElement.setAttribute('data-theme',d);}catch(e){
document.documentElement.setAttribute('data-theme','light');}}());
</script>`;

const head = ({ root, title, description, canonical, ogType = 'website',
                ogTitle, ogDescription, preloadImage }) => `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(CO.name)}">
<meta name="theme-color" content="#0f172a">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${esc(canonical)}">

<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(CO.name)}">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(ogDescription || description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(absolute('assets/images/logo.png'))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(ogTitle || title)}">
<meta name="twitter:description" content="${esc(ogDescription || description)}">
<meta name="twitter:image" content="${esc(absolute('assets/images/logo.png'))}">

<link rel="icon" href="${root}assets/images/logo.png" type="image/png">
<link rel="apple-touch-icon" href="${root}assets/images/logo.png">
<link rel="manifest" href="${root}site.webmanifest">
${preloadImage ? `\n<!-- The face on the card is the first thing that matters — fetch it early. -->\n<link rel="preload" as="image" href="${esc(preloadImage)}" fetchpriority="high">\n` : ''}
<!-- Fonts load without blocking paint; the stylesheet below has system-font
     fallbacks so text is readable immediately either way. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap"></noscript>

<link rel="stylesheet" href="${root}assets/css/style.css">
<noscript><style>[data-reveal]{opacity:1;transform:none}.preloader{display:none}</style></noscript>

${themeBootScript}`;

/* The GMSCPL mark is a square emblem. A remote logo (http) is used as-is;
   a site-relative path is prefixed with `root` so employee pages still find it. */
const LOGO_RATIO = CO.logoRatio || 1;
const logoSrc = (root) => /^https?:/i.test(CO.logo) ? CO.logo : (root + CO.logo);

const logoImg = ({ root, cls = 'brand__mark', size = 44, priority = false }) =>
  `<img class="${cls}" src="${esc(logoSrc(root))}" width="${Math.round(size * LOGO_RATIO)}" height="${size}" ` +
  `alt="${esc(CO.shortName || CO.name)} logo" ${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ` +
  `onerror="this.onerror=null;this.src='${root}${CO.logoFallback}'">`;

const reachBar = () => `<div class="topbar">
  <div class="shell topbar__inner">
    <span class="topbar__place">${esc(CO.address.street.replace(/, Banjara Hills$/, ''))}, ${esc(CO.address.locality)}</span>
    <a href="tel:${DATA.e164(CO.phone)}">${esc(DATA.phoneLabel(CO.phone))}</a>
    <a class="topbar__wa" href="https://wa.me/${DATA.waNumber(CO.phone)}?text=${encodeURIComponent('Hello GMSCPL, I would like to enquire about management systems certification.')}">WhatsApp</a>
    <a href="mailto:${esc(CO.email)}">${esc(CO.email)}</a>
  </div>
</div>`;

const brand = ({ root, priority = false }) => `<a class="brand" href="${root}index.html" aria-label="${esc(CO.name)} home">
          ${logoImg({ root, priority })}
          <span>
            <span class="brand__name">${esc(CO.shortName || CO.name)}</span>
            <span class="brand__tag">${esc(CO.tagline)}</span>
          </span>
        </a>`;

const themeToggle = () => `<button class="theme-toggle" type="button" data-action="theme" aria-pressed="false" aria-label="Switch between dark and light mode" title="Switch between dark and light mode">
          ${icon('sun', 'icon-sun')}${icon('moon', 'icon-moon')}
        </button>`;

/* Thin gradient bar across the top that tracks reading position. */
const scrollProgress = () =>
  `<div class="scroll-progress" aria-hidden="true"><span data-scroll-progress></span></div>`;

const preloader = ({ root, name }) => `<div class="preloader" role="status" aria-live="polite">
  <div class="preloader__inner">
    <span class="preloader__ring" aria-hidden="true"></span>
    ${logoImg({ root, cls: 'preloader__mark', size: 84, priority: true })}
    <p class="preloader__name">${esc(name)}</p>
    <p class="preloader__tag">${esc(CO.tagline)}</p>
    <div class="preloader__bar"><span></span></div>
  </div>
</div>`;

/* Decorative floating orbs behind a dark header. Purely presentational. */
const orbs = () => `<div class="orbs" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>`;

/* Company social links — the identical block on every page. */
const socialsBlock = () => CO.socials.map((s) =>
  `<a href="${esc(s.url)}" data-brand="${s.brand}" target="_blank" rel="noopener">` +
  `${icon(s.brand)}<span><b>${esc(s.label)}</b>` +
  (s.note ? `<small>${esc(s.note)}</small>` : '') + `</span></a>`
).join('\n            ');

const servicesGrid = () => CO.services.map((s) =>
  `<li class="standard" data-reveal>
              <span class="standard__mark">${icon(s.icon)}</span>
              <span><b>${esc(s.name)}</b><span>${esc(s.note)}</span></span>
            </li>`
).join('\n            ');

/* Both offices, each with a "navigate" link that opens turn-by-turn
   directions rather than just dropping a pin. */
const officesBlock = () => CO.offices.map((o) =>
  `<article class="office" data-reveal>
              <span class="office__mark">${icon(o.icon || 'pin')}</span>
              <p class="office__kind">${esc(o.kind)}</p>
              <p class="office__city">${esc(o.locality)}</p>
              <p class="office__line">${esc(DATA.addressLine(o))}</p>
              <div class="office__links">
                <a href="${esc(DATA.mapsUrl(o.mapQuery))}" target="_blank" rel="noopener">${icon('pin')} View on map</a>
                <a href="${esc(DATA.directionsUrl(o.mapQuery))}" target="_blank" rel="noopener">${icon('navigation')} Navigate</a>
              </div>
            </article>`
).join('\n            ');

const hoursBlock = () => {
  if (!CO.hours.length) {
    return `<p class="hours-note">Working hours are not printed on the GST certificate or the business card. Call ${esc(DATA.phoneLabel(CO.phone))} or email ${esc(CO.email)} to confirm availability.</p>`;
  }
  return `<ul class="hours">
            ${CO.hours.map((h) => `<li class="hours__row${h.open ? '' : ' is-closed'}">
              <span>${icon(h.open ? 'clock' : 'calendar')} ${esc(h.days)}</span>
              <b>${esc(h.time)}</b>
            </li>`).join('\n            ')}
          </ul>`;
};

/* GST REG-06 / Annexure A facts. Shown on the landing page and every card. */
const registrationFacts = () => {
  const r = CO.registration || {};
  const rows = [
    ['Legal name', r.legalName || CO.legalName],
    ['Trade name', r.tradeName || CO.tradeName],
    ['GSTIN', r.gstin],
    ['Constitution of business', r.constitution],
    ['Type of registration', r.registrationType],
    ['Date of issue of certificate', r.certificateDate],
    ['Period of validity from', r.validFrom],
    ['Period of validity to', r.validTo],
    ['Additional places of business', r.additionalPlaces != null ? String(r.additionalPlaces) : ''],
    ['Principal place of business', DATA.addressLine(CO.offices[0])]
  ].filter((row) => row[1]);
  return `<dl class="facts">${rows.map(([dt, dd]) =>
    `<div class="fact"><dt>${esc(dt)}</dt><dd>${dt === 'GSTIN' ? `<code>${esc(dd)}</code>` : esc(dd)}</dd></div>`
  ).join('\n              ')}</dl>`;
};

/* Brochure call-to-action. Omitted when the company has not supplied a PDF. */
const brochureCta = ({ root }) => {
  if (!CO.brochure) return '';
  return `<article class="brochure" data-reveal>
          <div class="brochure__art">
            <img src="${root}assets/images/logo.png" width="640" height="336"
                 alt="${esc(CO.name)}" loading="lazy" decoding="async">
            <span class="brochure__tag">PDF</span>
          </div>
          <div class="brochure__body">
            <p class="eyebrow">Company brochure</p>
            <h3>Everything ${esc(CO.name)} does, in one document</h3>
            <p>${esc(CO.brochureLabel || 'Company brochure')}</p>
            <div class="brochure__actions">
              <a class="btn" href="${esc(CO.brochure)}" target="_blank" rel="noopener">
                ${icon('download')} Download brochure
              </a>
              <a class="btn btn--ghost" href="${esc(CO.website)}" target="_blank" rel="noopener">
                ${icon('globe')} ${esc(CO.websiteLabel)}
              </a>
            </div>
          </div>
        </article>`;
};

const footer = ({ root }) => {
  const cards = DATA.all().map((e) =>
    `<li><a href="${cardHref(root, e.slug)}">${esc(e.name)}</a></li>`
  ).join('\n            ');

  const socialLinks = CO.socials.map((s) =>
    `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`
  ).join('\n            ');

  return `<footer class="site-footer">
  <div class="shell">
    <div class="grid footer-grid">
      <div>
        ${brand({ root })}
        <p style="margin-top:1rem;max-width:24rem">${esc(CO.description)}</p>
        <p class="footer-note">${CO.hours[0]
          ? `${icon('clock')} ${esc(CO.hours[0].days)} · ${esc(CO.hours[0].time)}`
          : `${icon('phone')} ${esc(DATA.phoneLabel(CO.phone))}`}</p>
      </div>
      <div>
        <h4>Digital ID Cards</h4>
        <ul>
            ${cards}
        </ul>
      </div>
      <div>
        <h4>Connect</h4>
        <ul>
            ${socialLinks}
            ${CO.brochure ? `<li><a href="${esc(CO.brochure)}" target="_blank" rel="noopener">Company brochure (PDF)</a></li>` : ''}
        </ul>
      </div>
      <div>
        <h4>Reach us</h4>
        <ul>
          <li><a href="tel:${DATA.e164(CO.phone)}">${esc(DATA.phoneLabel(CO.phone))}</a></li>
          <li><a href="https://wa.me/${DATA.waNumber(CO.phone)}?text=${encodeURIComponent('Hello GMSCPL, I would like to enquire about management systems certification.')}">WhatsApp chat</a></li>
          ${(CO.emails || [{ address: CO.email }]).map((item) =>
            `<li><a href="mailto:${esc(item.address)}">${esc(item.address)}</a></li>`).join('\n          ')}
          <li><a href="${esc(CO.website)}" target="_blank" rel="noopener">${esc(CO.websiteLabel)}</a></li>
            ${CO.offices.map((o) => `<li><a href="${esc(DATA.mapsUrl(o.mapQuery))}" target="_blank" rel="noopener">${esc(o.kind)} — ${esc(o.locality)}</a></li>`).join('\n            ')}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year>2026</span> ${esc(CO.name)}. All rights reserved.</span>
      <span>${esc(CO.tagline)}</span>
    </div>
  </div>
</footer>`;
};

const scripts = ({ root, withData = false }) => `${withData ? `<script src="${root}assets/js/data.js" defer></script>\n` : ''}<script src="${root}assets/js/main.js" defer></script>
<script>
  /* Safety net: if main.js fails to load, nothing may stay hidden. */
  setTimeout(function () {
    if (!window.GMSCPLSite && !window.DasskSite) {
      var nodes = document.querySelectorAll('[data-reveal]');
      for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('is-in');
      var p = document.querySelector('.preloader');
      if (p) p.classList.add('is-done');
    }
  }, 3000);
</script>`;

/* --- Monogram avatar -----------------------------------------------------
   Written for every employee, whether or not they have a photograph: it is
   what the browser falls back to if the photo file is missing or fails to
   load. Deterministic per employee ID, so it never changes between builds. */
const avatarSvg = (e) => {
  const [from, to] = e.gradient;
  const id = 'g' + e.id.replace(/[^0-9A-Za-z]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320" role="img" aria-label="${esc(e.name)}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="${id}s" cx="0.32" cy="0.24" r="0.85">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="320" height="320" fill="url(#${id})"/>
  <rect width="320" height="320" fill="url(#${id}s)"/>
  <circle cx="160" cy="160" r="118" fill="#ffffff" opacity="0.10"/>
  <circle cx="160" cy="160" r="92" fill="#ffffff" opacity="0.08"/>
  <circle cx="160" cy="160" r="146" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.5"/>
  <text x="160" y="160" text-anchor="middle" dominant-baseline="central"
        font-family="Poppins, Segoe UI, system-ui, sans-serif" font-size="118"
        font-weight="600" fill="#ffffff" letter-spacing="2">${esc(e.initials)}</text>
</svg>
`;
};

/* --- vCard ---------------------------------------------------------------
   vCard 3.0, the version phones handle most consistently. */
const vcard = (e) => {
  const v = (value) => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n')
    .replace(/,/g, '\\,').replace(/;/g, '\\;');

  const a = CO.address;
  const street = [a.premises, a.street].filter(Boolean).join(', ');
  const telType = e.phoneDirect ? 'CELL,VOICE' : 'WORK,VOICE';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:;${v(e.name)};;;`,
    `FN:${v(e.name)}`,
    `ORG:${v(CO.legalName || CO.name)}`,
    `TITLE:${v(e.designation)}`,
    `TEL;TYPE=${telType}:${e.reachPhoneE164}`,
    `EMAIL;TYPE=INTERNET,WORK:${e.reachEmail}`,
    `URL;TYPE=WORK:${CO.website}`,
    `URL;TYPE=PROFILE:${e.profileUrl}`,
    `ADR;TYPE=WORK:;;${v(street)};${v(a.locality)};${v(a.region)};${v(a.postalCode)};${v(a.country)}`,
    `NOTE:${v(
      e.designation + ' at ' + CO.name + ' · Employee ID ' + e.id +
      (e.residentState ? ' · Resident of ' + e.residentState : '') +
      (CO.registration ? ' · GSTIN ' + CO.registration.gstin : '') +
      (e.phoneDirect ? '' : ' · Phone shown is the company line.') +
      ' ' + e.bio
    )}`,
    `X-GMSCPL-EMPLOYEE-ID:${v(e.id)}`,
    `CATEGORIES:${v(CO.shortName || CO.name)}`
  ];
  (e.emails || []).forEach((addr) => {
    if (addr && addr !== e.reachEmail) lines.push(`EMAIL;TYPE=INTERNET:${addr}`);
  });

  // Only reference a photo when a real image file exists for it.
  if (e.hasPhoto) {
    lines.push(`PHOTO;VALUE=URI:${e.profileUrl}${encodeFile(e.photo)}`);
  }
  if (e.linkedin) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${e.linkedin}`);
    lines.push(`URL;TYPE=LINKEDIN:${e.linkedin}`);
  }
  lines.push(`REV:${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}`);
  lines.push('END:VCARD');

  /* Fold lines longer than 75 octets, as the specification requires — some
     Android contact importers reject over-long lines outright. */
  const folded = lines.flatMap((line) => {
    const bytes = Buffer.from(line, 'utf8');
    if (bytes.length <= 75) return [line];
    const out = [];
    let start = 0;
    let limit = 75;
    while (start < bytes.length) {
      let end = Math.min(start + limit, bytes.length);
      // Never split a multi-byte UTF-8 character.
      while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
      out.push((start === 0 ? '' : ' ') + bytes.slice(start, end).toString('utf8'));
      start = end;
      limit = 74; // continuation lines carry a leading space
    }
    return out;
  });

  return folded.join('\r\n') + '\r\n';
};

/* --- The photograph on a card -------------------------------------------
   One <img> with an inline onerror that swaps in the monogram and marks the
   frame, so a missing or broken photo degrades to the branded initials even
   with JavaScript switched off. */
const photoImg = (e, { size, cls = '', priority = false }) =>
  `<img${cls ? ` class="${cls}"` : ''} src="${encodeFile(e.photo)}" width="${size}" height="${size}" ` +
  `alt="${esc(e.name)}, ${esc(e.designation)} at ${esc(CO.name)}" ` +
  `${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ` +
  `onerror="this.onerror=null;this.src='${encodeFile(e.avatar)}';this.parentNode.classList.add('is-fallback')">`;

/* --- Ready-made message cards -------------------------------------------
   Each card is one professional, pre-written enquiry addressed to this
   employee. The visitor picks the topic; WhatsApp or the mail client opens
   with the whole message already composed. */
const messageCards = (e) => e.enquiries.map((t, i) => `<article class="msg-card${i === 0 ? ' msg-card--lead' : ''}" data-reveal>
            <div class="msg-card__head">
              <span class="msg-card__mark">${icon(t.icon)}</span>
              <span>
                <b>${esc(t.label)}</b>
                <small>${esc(t.note)}</small>
              </span>
            </div>
            <p class="msg-card__preview">${esc(t.whatsappText)}</p>
            <div class="msg-card__actions">
              <a class="btn btn--sm btn--wa" href="${esc(t.whatsappUrl)}">
                ${icon('whatsapp')} WhatsApp
              </a>
              <a class="btn btn--sm btn--ghost" href="${esc(t.emailUrl)}">
                ${icon('mail')} Email
              </a>
              <button class="btn btn--sm btn--ghost btn--icon" type="button"
                      data-action="copy-message"
                      data-copy="${esc(t.whatsappText)}"
                      aria-label="Copy the &quot;${esc(t.label)}&quot; message">
                ${icon('copy')}
              </button>
            </div>
          </article>`).join('\n\n          ');

/* --- Employee page ------------------------------------------------------- */
const employeePage = (e) => {
  const root = '../../';
  const title = `${e.name} — ${e.designation} | ${CO.name}`;
  const description = `${e.name} (${e.id}), ${e.designation} at ${CO.name}. ` +
    `Call, WhatsApp, email, get directions or save the contact directly from this digital ID card.`;

  const linkedinMark = e.linkedin
    ? `<a class="linkedin-mark" href="${esc(e.linkedin)}" target="_blank" rel="noopener" aria-label="${esc(e.name)} on LinkedIn" title="${esc(e.name)} on LinkedIn">${icon('linkedin')}</a>`
    : `<span class="linkedin-mark linkedin-mark--empty" role="img" aria-label="LinkedIn profile not yet available" title="LinkedIn profile will be added here">${icon('linkedin')}</span>`;

  const skills = e.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join('\n            ');
  const highlights = e.highlights.map((h) =>
    `<li data-reveal>${icon('check')}<span>${esc(h)}</span></li>`
  ).join('\n            ');

  const hq = CO.offices[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: e.name,
    identifier: e.id,
    jobTitle: e.designation,
    description: e.bio,
    url: e.profileUrl,
    image: e.profileUrl + encodeFile(e.photo),
    telephone: e.reachPhoneE164,
    email: 'mailto:' + e.reachEmail,
    knowsAbout: e.skills,
    ...(e.linkedin ? { sameAs: [e.linkedin] } : {}),
    worksFor: {
      '@type': 'Organization',
      name: CO.name,
      url: CO.website + '/',
      logo: absolute(CO.logo),
      slogan: CO.tagline,
      sameAs: CO.socials.filter((s) => s.brand !== 'globe').map((s) => s.url)
    },
    workLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: CO.address.locality,
        addressRegion: CO.address.region,
        postalCode: CO.address.postalCode,
        addressCountry: CO.address.countryCode
      }
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({ root, title, description, canonical: e.profileUrl, ogType: 'profile',
         preloadImage: encodeFile(e.photo) })}

<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>
</head>
<body data-employee-id="${esc(e.id)}" class="has-contact-bar">

<!-- Premium loading animation — removed by main.js once the page is ready -->
${preloader({ root, name: e.name })}
${scrollProgress()}

<a class="skip-link" href="#main">Skip to content</a>
${reachBar()}

<div class="print-head">
  ${logoImg({ root, size: 72 })}
  <p class="print-head__company">${esc(CO.name)}</p>
  <p>Employee details · ${esc(e.id)} · GSTIN ${esc(CO.registration ? CO.registration.gstin : '')}</p>
</div>

<main id="main">

  <!-- ========================================================================
       Digital ID card header
       ======================================================================== -->
  <header class="profile">
    ${orbs()}
    <div class="shell">
      <div class="profile__top">
        ${brand({ root, priority: true })}
        <div class="profile__tools">
          ${themeToggle()}
          <a class="btn btn--on-dark btn--sm" href="${root}index.html#team">All ID cards</a>
        </div>
      </div>

      <!-- The card itself: a physical-ID-card shape, so the digital version
           reads as the same object the visitor is holding. -->
      <div class="idcard" data-tilt>
        <span class="idcard__sheen" aria-hidden="true"></span>
        <div class="idcard__strip" aria-hidden="true">
          <span class="idcard__chip"></span>
          <span class="idcard__brand">${esc(CO.shortName || CO.name)}</span>
          <span class="idcard__type">Employee ID</span>
        </div>

        <div class="profile__photo${e.hasPhoto ? '' : ' is-fallback'}">
          ${photoImg(e, { size: 168, priority: true })}
          <span class="photo-verified" title="Verified employee of ${esc(CO.name)}" aria-hidden="true">${icon('check')}</span>
        </div>

        <div class="profile__name-row">
          <h1 class="profile__name">${esc(e.name)}</h1>
          ${linkedinMark}
        </div>

        <p class="profile__role">${esc(e.designation)}</p>

        <div class="profile__ids">
          <span class="id-badge">${icon('idCard')}${esc(e.id)}</span>
          <span class="id-badge id-badge--status"><i class="live-dot" aria-hidden="true"></i>${esc(e.status)}</span>
        </div>

        <div class="profile__meta">
          <span>${icon('layers')} ${esc(e.department)}</span>
          <span>${icon('pin')} ${esc(e.residentState ? 'Resident of ' + e.residentState : hq.locality + ', ' + hq.country)}</span>
          <span>${icon('star')} Since ${esc(CO.since)}</span>
        </div>

        <p class="profile__company">${icon('building')} ${esc(CO.name)} · ${esc(CO.tagline)}</p>
      </div>
    </div>
  </header>

  <!-- ========================================================================
       Action buttons — plain links, so they work even without JavaScript
       ======================================================================== -->
  <div class="shell actions-wrap">
    <div class="card card--glass" style="border-radius:var(--r-xl)">
      <p class="eyebrow" style="margin-bottom:1.1rem">One tap to reach ${esc(e.firstName)}</p>
      <div class="actions">
        <a class="btn btn--tile" href="${esc(e.telUrl)}">
          <span class="btn__icon">${icon('phone')}</span>
          <span class="btn__label"><b>Call</b><span>${esc(e.phoneDirect ? e.phoneLabel : 'Company line · ' + e.reachPhoneLabel)}</span></span>
        </a>
        <a class="btn btn--tile" data-accent="green" href="${esc(e.whatsappUrl)}">
          <span class="btn__icon">${icon('whatsapp')}</span>
          <span class="btn__label"><b>WhatsApp</b><span>${esc(e.phoneDirect ? 'Message already written' : 'Company line')}</span></span>
        </a>
        <a class="btn btn--tile" data-accent="cyan" href="${esc(e.emailUrl)}">
          <span class="btn__icon">${icon('mail')}</span>
          <span class="btn__label"><b>Email</b><span>${esc(e.emailDirect ? e.email : 'Company email · ' + e.reachEmail)}</span></span>
        </a>
        <a class="btn btn--tile" data-accent="navy" href="contact.vcf" download>
          <span class="btn__icon">${icon('userPlus')}</span>
          <span class="btn__label"><b>Save Contact</b><span>Add to phonebook (.vcf)</span></span>
        </a>
        <a class="btn btn--tile" data-accent="cyan" href="${esc(DATA.directionsUrl(hq.mapQuery))}" target="_blank" rel="noopener">
          <span class="btn__icon">${icon('navigation')}</span>
          <span class="btn__label"><b>Navigate</b><span>Directions to the office</span></span>
        </a>
        ${CO.brochure ? `<a class="btn btn--tile" data-accent="pink" href="${esc(CO.brochure)}" target="_blank" rel="noopener">
          <span class="btn__icon">${icon('file')}</span>
          <span class="btn__label"><b>Company Brochure</b><span>Open the PDF</span></span>
        </a>` : `<button class="btn btn--tile" type="button" data-accent="pink" data-action="print">
          <span class="btn__icon">${icon('download')}</span>
          <span class="btn__label"><b>Download PDF</b><span>Employee details</span></span>
        </button>`}
        <a class="btn btn--tile" href="${esc(CO.website)}" target="_blank" rel="noopener">
          <span class="btn__icon">${icon('globe')}</span>
          <span class="btn__label"><b>Visit Website</b><span>${esc(CO.websiteLabel)}</span></span>
        </a>
        <button class="btn btn--tile" type="button" data-accent="navy" data-action="share">
          <span class="btn__icon">${icon('share')}</span>
          <span class="btn__label"><b>Share Profile</b><span>Send this card to anyone</span></span>
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================================
       Ready-made professional messages
       Pick a topic — WhatsApp or the mail client opens with the whole enquiry
       already composed and addressed to this employee.
       ======================================================================== -->
  <section class="section no-print" id="message">
    <div class="shell">
      <div class="section__head">
        <p class="eyebrow">Write to ${esc(e.firstName)}</p>
        <h2>Pick a message — it is already written</h2>
        <p>Every option below opens WhatsApp or your mail app with a complete, professional
           enquiry addressed to ${esc(e.firstName)} and quoting ${esc(e.id)}. Nothing to type.</p>
      </div>

      <div class="grid msg-grid">
          ${messageCards(e)}
      </div>

      <p class="msg-foot">
        ${icon('phone')} Prefer to talk? Call
        <a href="${esc(e.telUrl)}">${esc(e.reachPhoneLabel)}</a>${CO.hours[0]
          ? ` — ${esc(CO.hours[0].days)}, ${esc(CO.hours[0].time)}.`
          : '.'}
      </p>
    </div>
  </section>

  <!-- ========================================================================
       About this employee
       ======================================================================== -->
  <section class="section" style="padding-top:0">
    <div class="shell">
      <div class="profile-about">
        <div>
          <p class="eyebrow">About ${esc(e.firstName)}</p>
          <h2>${esc(e.designation)}</h2>
          <p class="lede">${esc(e.bio)}</p>

          <h3 class="mini-head">${icon('bolt')} Skills &amp; focus areas</h3>
          <div class="chip-row" data-reveal>
            ${skills}
          </div>

          <h3 class="mini-head">${icon('check')} Responsibilities</h3>
          <ul class="detail-list">
            ${highlights}
          </ul>
        </div>

        <aside>
          <div class="card card--sheen">
            <h3 class="mini-head">${icon('idCard')} Employee record</h3>
            <dl class="facts" style="margin:1rem 0 0">
              <div class="fact"><dt>Employee ID</dt><dd><code>${esc(e.id)}</code></dd></div>
              <div class="fact"><dt>Name</dt><dd>${esc(e.name)}</dd></div>
              <div class="fact"><dt>Designation / Status</dt><dd>${esc(e.designation)}</dd></div>
              <div class="fact"><dt>Department</dt><dd>${esc(e.department)}</dd></div>
              ${e.residentState ? `<div class="fact"><dt>Resident of State</dt><dd>${esc(e.residentState)}</dd></div>` : ''}
              <div class="fact"><dt>Status</dt><dd><span class="pill-ok"><i class="live-dot" aria-hidden="true"></i>${esc(e.status)}</span></dd></div>
              <div class="fact"><dt>Office</dt><dd>${esc(hq.locality)}, ${esc(hq.region)}</dd></div>
              ${CO.registration ? `<div class="fact"><dt>Company GSTIN</dt><dd><code>${esc(CO.registration.gstin)}</code></dd></div>` : ''}
            </dl>
          </div>

          <div class="card" style="margin-top:1.25rem">
            <h3 class="mini-head">${icon('chat')} Direct contact</h3>
            <div class="grid" style="gap:1rem;margin-top:1rem">
              <div class="contact-item">
                <span class="icon-badge">${icon('phone')}</span>
                <span><b>${e.phoneDirect ? 'Phone' : 'Company phone'}</b><a href="${esc(e.telUrl)}">${esc(e.reachPhoneLabel)}</a></span>
              </div>
              <div class="contact-item">
                <span class="icon-badge icon-badge--green">${icon('whatsapp')}</span>
                <span><b>${e.phoneDirect ? 'WhatsApp' : 'Company WhatsApp'}</b><a href="${esc(e.whatsappUrl)}">${esc(e.reachPhoneLabel)}</a></span>
              </div>
              ${(e.emailDirect ? e.emails : (CO.emails || []).map((item) => item.address)).map((addr, i) => `<div class="contact-item">
                <span class="icon-badge icon-badge--cyan">${icon('mail')}</span>
                <span><b>${e.emailDirect ? (i === 0 ? 'Email' : 'Also on card') : 'Company email'}</b><a href="mailto:${esc(addr)}">${esc(addr)}</a></span>
              </div>`).join('\n              ')}
              <div class="contact-item">
                <span class="icon-badge icon-badge--pink">${icon('navigation')}</span>
                <span><b>Office</b><a href="${esc(DATA.directionsUrl(hq.mapQuery))}" target="_blank" rel="noopener">${esc(DATA.addressLine(hq))}</a></span>
              </div>
            </div>
          </div>

          <div class="card" style="margin-top:1.25rem">
            <h3 class="mini-head">${icon('clock')} Working hours</h3>
            ${hoursBlock()}
          </div>
        </aside>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       About the company + services + offices + common social links
       ======================================================================== -->
  <section class="section" style="padding-top:0">
    <div class="shell">
      <div class="card card--glass" style="border-radius:var(--r-xl)">
        <div class="section__head" style="margin-bottom:2rem">
          <p class="eyebrow">About the company</p>
          <h2>${esc(CO.name)}</h2>
          <p>${esc(CO.description)}</p>
        </div>

        <div class="registration">
          <p class="eyebrow" style="margin-bottom:.9rem">Company registration</p>
          ${registrationFacts()}
        </div>

        <ul class="grid standards">
            ${servicesGrid()}
        </ul>

        <div class="company-split">
          <div>
            <p class="eyebrow" style="margin-bottom:.9rem">Our offices</p>
            <div class="grid office-grid">
            ${officesBlock()}
            </div>
          </div>
        </div>

        <div style="margin-top:2.25rem">
          <p class="eyebrow" style="margin-bottom:.9rem">Follow ${esc(CO.name)}</p>
          <div class="socials">
            ${socialsBlock()}
          </div>
        </div>

        <div class="brochure-wrap">
        ${brochureCta({ root })}
        </div>

        <div class="hero__actions" style="margin-top:2rem">
          <a class="btn btn--ghost" href="${root}index.html#team">${icon('users')} See all digital ID cards</a>
        </div>
      </div>
    </div>
  </section>

</main>

${footer({ root })}

<!-- Floating actions -->
<div class="fabs">
  <a class="fab fab--whatsapp" href="${esc(e.whatsappUrl)}" aria-label="WhatsApp ${esc(e.name)} with a ready-written message">
    ${icon('whatsapp')}
  </a>
  <a class="fab fab--call" href="${esc(e.telUrl)}" aria-label="Call ${esc(e.name)}">
    ${icon('phone')}
  </a>
  <button class="fab fab--top" type="button" data-action="scroll-top" aria-label="Scroll back to top">
    ${icon('arrowUp')}
  </button>
</div>

<!-- ==========================================================================
     Sticky contact bar — one-hand reach on a phone, hidden on desktop
     ========================================================================== -->
<nav class="contact-bar contact-bar--5" aria-label="Quick contact">
  <a href="${esc(e.telUrl)}" data-accent="blue">${icon('phone')}<span>Call</span></a>
  <a href="${esc(e.whatsappUrl)}" data-accent="green">${icon('whatsapp')}<span>WhatsApp</span></a>
  <a href="${esc(e.emailUrl)}" data-accent="cyan">${icon('mail')}<span>Email</span></a>
  <a href="${esc(DATA.directionsUrl(hq.mapQuery))}" target="_blank" rel="noopener" data-accent="pink">${icon('navigation')}<span>Navigate</span></a>
  <a href="contact.vcf" download data-accent="navy">${icon('userPlus')}<span>Save</span></a>
</nav>

<div class="toast" role="status" aria-live="polite">${icon('check')}<span data-toast-text></span></div>

${scripts({ root })}
</body>
</html>
`;
};

/* --- Landing-page service cards ------------------------------------------
   The same CO.services list that appears compactly on employee pages, shown
   here as full cards. Accent colours rotate so the grid does not read flat. */
const serviceCards = () => {
  const accents = ['', ' icon-badge--cyan', ' icon-badge--green', ' icon-badge--pink'];
  return CO.services.map((s, i) =>
    `        <article class="card card--hover service" data-reveal>
          <span class="icon-badge${accents[i % accents.length]}">${icon(s.icon)}</span>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.note)}</p>
        </article>`
  ).join('\n');
};

/* --- Landing-page directory --------------------------------------------- */
const directoryCards = () => DATA.all().map((e) => {
  // Lower-cased haystack the search box filters against.
  const haystack = [e.name, e.id, e.designation, e.department, e.residentState,
    e.email, e.reachEmail, ...(e.emails || []), e.phone, e.phoneLabel, e.reachPhoneLabel,
    e.skills.join(' ')].filter(Boolean).join(' ').toLowerCase();

  return `        <article class="card card--hover member" data-reveal data-search="${esc(haystack)}" data-designation="${esc(e.designation.toLowerCase())}" data-state="${esc((e.residentState || '').toLowerCase())}">
          <div class="member__photo${e.hasPhoto ? '' : ' is-fallback'}">
            <img src="employees/${e.slug}/${encodeFile(e.photo)}" width="118" height="118" alt="${esc(e.name)}, ${esc(e.designation)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='employees/${e.slug}/${encodeFile(e.avatar)}';this.parentNode.classList.add('is-fallback')">
          </div>
          <span class="member__id">${icon('idCard')}${esc(e.id)}</span>
          <p class="member__name">${esc(e.name)}</p>
          <p class="member__role">${esc(e.designation)}</p>
          ${e.residentState ? `<p class="member__state">Resident of ${esc(e.residentState)}</p>` : ''}
          <p class="member__bio">${esc(e.bio.split('. ')[0])}.</p>
          <div class="member__quick">
            <a href="${esc(e.telUrl)}" aria-label="Call ${esc(e.name)}">${icon('phone')}</a>
            <a href="${esc(e.whatsappUrl)}" aria-label="WhatsApp ${esc(e.name)}">${icon('whatsapp')}</a>
            <a href="${esc(e.emailUrl)}" aria-label="Email ${esc(e.name)}">${icon('mail')}</a>
          </div>
          <a class="btn btn--block" data-card-link href="${cardHref('', e.slug)}">View digital ID card ${icon('chevronRight')}</a>
        </article>`;
}).join('\n\n');

/* --- Landing-page office + hours region --------------------------------- */
const officesRegion = () => `        <div>
          <p class="eyebrow" style="margin-bottom:.9rem">Our offices</p>
          <div class="grid office-grid">
            ${officesBlock()}
          </div>
        </div>
        <div>
          <p class="eyebrow" style="margin-bottom:.9rem">Working hours</p>
          ${hoursBlock()}
        </div>`;

/* --- Sitemap ------------------------------------------------------------- */
const sitemap = () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: absolute(''), priority: '1.0' },
    ...DATA.all().map((e) => ({ loc: e.profileUrl, priority: '0.8' }))
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by tools/build.mjs — do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
};

/* --- Run ----------------------------------------------------------------- */
const written = [];
const employees = DATA.all();

/* 0 · Resolve each employee's photograph from their own folder, so the pages,
       the vCards and the landing-page directory all agree. */
for (const e of employees) {
  const found = findPhoto(e);
  if (found) {
    e.photo = found;
    e.hasPhoto = true;
  } else {
    e.photo = e.avatar;
    e.hasPhoto = false;
  }
}

/* 1 · Per-employee folder: page, vCard, and the monogram fallback avatar */
for (const e of employees) {
  written.push(write(`employees/${e.slug}/index.html`, employeePage(e)));
  written.push(write(`employees/${e.slug}/contact.vcf`, vcard(e)));
  written.push(write(`employees/${e.slug}/avatar.svg`, avatarSvg(e)));
}

/* 2 · Refresh the generated regions of index.html.
      Each region sits between <!-- BUILD:<name>-start --> and
      <!-- BUILD:<name>-end -->, so the rest of the landing page stays
      hand-editable. */
const filterBar = () => {
  const roles = [];
  const states = [];
  DATA.all().forEach((e) => {
    if (roles.indexOf(e.designation) === -1) roles.push(e.designation);
    if (e.residentState && states.indexOf(e.residentState) === -1) states.push(e.residentState);
  });
  const btn = (value, label) =>
    `<button class="filter-btn${value ? '' : ' is-on'}" type="button" data-filter="${esc(value)}">${esc(label)}</button>`;
  return `<div class="filters" role="group" aria-label="Filter employees">
          ${btn('', 'All')}
          ${roles.map((role) => btn(role.toLowerCase(), role)).join('\n          ')}
          ${states.map((state) => btn(state.toLowerCase(), state)).join('\n          ')}
        </div>`;
};

const registrationRegion = () => `<div class="registration">
          <p class="eyebrow" style="margin-bottom:.9rem">Company registration</p>
          ${registrationFacts()}
        </div>`;

const indexRegions = {
  team: directoryCards(),
  filters: filterBar(),
  services: serviceCards(),
  socials: socialsBlock(),
  offices: officesRegion(),
  registration: registrationRegion(),
  footer: footer({ root: '' })
};

const sourcePath = join(ROOT, 'index.source.html');
const indexPath = existsSync(sourcePath) ? sourcePath : join(ROOT, 'index.html');
if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, 'utf8');
  const applied = [];

  for (const [name, contents] of Object.entries(indexRegions)) {
    const START = `<!-- BUILD:${name}-start -->`;
    const END = `<!-- BUILD:${name}-end -->`;
    const from = html.indexOf(START);
    const to = html.indexOf(END);

    if (from === -1 || to === -1 || to < from) {
      console.warn(`! index.html is missing the BUILD:${name} markers — that region was not refreshed.`);
      continue;
    }
    html = html.slice(0, from + START.length) + '\n' + contents + '\n' + html.slice(to);
    applied.push(name);
  }

  writeFileSync(indexPath, html, 'utf8');
  const livePath = join(ROOT, 'index.html');
  if (livePath !== indexPath) {
    try {
      writeFileSync(livePath, html, 'utf8');
      written.push(`index.html (regions: ${applied.join(', ')})`);
    } catch (err) {
      console.warn(`! index.html is locked (${err.message}). The updated page is in index.source.html.`);
      written.push(`index.source.html (regions: ${applied.join(', ')})`);
    }
  } else {
    written.push(`index.html (regions: ${applied.join(', ')})`);
  }
}

/* 3 · Sitemap */
written.push(write('sitemap.xml', sitemap()));

/* 4 · Remove employee folders that are no longer in the data file, so a
       renamed or deleted employee does not leave a live page behind. */
const employeesDir = join(ROOT, 'employees');
const keep = new Set(employees.map((e) => e.slug));
if (existsSync(employeesDir)) {
  for (const entry of readdirSync(employeesDir)) {
    const full = join(employeesDir, entry);
    if (statSync(full).isDirectory() && !keep.has(entry)) {
      rmSync(full, { recursive: true, force: true });
      console.log(`  removed stale folder employees/${entry}/`);
    }
  }
}

/* --- Report -------------------------------------------------------------- */
console.log(`\nGMSCPL digital ID cards — build complete`);
console.log(`  ${employees.length} employees`);
written.forEach((f) => console.log(`  + ${f}`));

if (photoReport.length) {
  console.log('\nPhotograph warnings');
  photoReport.forEach((line) => console.log(`  ${line}`));
}

const missing = employees.filter((e) => !e.hasPhoto);
console.log('\nPhotographs');
employees.filter((e) => e.hasPhoto)
  .forEach((e) => console.log(`  ✓ ${e.id}  ${e.photo}`));
if (missing.length) {
  missing.forEach((e) => console.log(`  · ${e.id}  no photo in employees/${e.slug}/ — ` +
    `showing the "${e.initials}" monogram`));
}

/* The addresses to encode when generating the printed QR codes by hand. */
console.log('\nProfile URLs — encode these when you generate the printed QR codes');
employees.forEach((e) => console.log(`  ${e.id}  ${e.profileUrl}`));
console.log('');
