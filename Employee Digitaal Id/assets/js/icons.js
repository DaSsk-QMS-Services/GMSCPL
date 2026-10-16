/* ============================================================================
   DaSsk QMS Services — Digital Employee ID Card System
   icons.js  ·  Inline SVG icon set

   Hand-drawn 24x24 outlines (plus a few solid brand marks) so the site ships
   with zero icon-font, sprite or CDN requests. Shared by the browser and by
   tools/build.mjs, so an icon looks identical in generated markup and in
   anything rendered at runtime.

   Usage:  DasskIcons.svg('phone')            -> '<svg ...>...</svg>'
           DasskIcons.svg('phone', 'my-cls')  -> adds a class attribute
   ========================================================================== */
(function (root) {
  'use strict';

  var S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  var PATHS = {
    /* --- Contact & actions --- */
    phone: '<path ' + S + ' d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
    mail: '<path ' + S + ' d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path ' + S + ' d="m3.5 6.5 8.5 6 8.5-6"/>',
    whatsapp: '<path ' + S + ' d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.7Z"/><path ' + S + ' d="M9 8.4c.4-.1.7 0 .9.4l.7 1.5c.1.3.1.5-.1.7l-.6.7c.6 1.2 1.6 2.1 2.8 2.6l.6-.7c.2-.2.5-.3.7-.2l1.6.6c.4.2.5.5.4.9-.2.9-1.1 1.5-2 1.4-3.4-.3-6.2-3.1-6.5-6.5-.1-.9.4-1.7 1.5-1.4Z"/>',
    userPlus: '<path ' + S + ' d="M15 21v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V21"/><circle ' + S + ' cx="9" cy="7.5" r="3.8"/><path ' + S + ' d="M18 8.5v5M20.5 11h-5"/>',
    globe: '<circle ' + S + ' cx="12" cy="12" r="9"/><path ' + S + ' d="M3.2 9.5h17.6M3.2 14.5h17.6"/><path ' + S + ' d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
    file: '<path ' + S + ' d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path ' + S + ' d="M14 3v5h5M9 13h6M9 17h4"/>',
    pin: '<path ' + S + ' d="M12 21.5S19 15.4 19 10a7 7 0 1 0-14 0c0 5.4 7 11.5 7 11.5Z"/><circle ' + S + ' cx="12" cy="10" r="2.6"/>',
    share: '<path ' + S + ' d="M4 12.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.5"/><path ' + S + ' d="M12 3v12M8 7l4-4 4 4"/>',
    arrowUp: '<path ' + S + ' d="M12 20V5M5 12l7-7 7 7"/>',
    check: '<circle ' + S + ' cx="12" cy="12" r="9"/><path ' + S + ' d="m8.5 12.2 2.4 2.4 4.6-4.9"/>',
    copy: '<rect ' + S + ' x="9" y="9" width="11" height="11" rx="2"/><path ' + S + ' d="M5.5 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v.5"/>',
    download: '<path ' + S + ' d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path ' + S + ' d="M4 17.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5"/>',
    x: '<path ' + S + ' d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle ' + S + ' cx="11" cy="11" r="7"/><path ' + S + ' d="m16.5 16.5 4.5 4.5"/>',

    /* Navigation, messaging and time — used by the contact actions, the
       ready-made message templates and the office / working-hours blocks. */
    navigation: '<path ' + S + ' d="M20.5 3.5 3.8 10.2a.6.6 0 0 0 .05 1.13l6.4 2.4 2.4 6.4a.6.6 0 0 0 1.13.05Z"/><path ' + S + ' d="m10.3 13.7 4.4-4.4"/>',
    chat: '<path ' + S + ' d="M20.5 12.2a7.7 7.7 0 0 1-11.2 6.9L4.5 20.5l1.4-4.5A7.7 7.7 0 1 1 20.5 12.2Z"/><path ' + S + ' d="M9 11.5h6M9 14.5h3.5"/>',
    send: '<path ' + S + ' d="M21 3 10.5 13.5"/><path ' + S + ' d="M21 3l-6.8 18-3.7-7.5L3 9.8Z"/>',
    clock: '<circle ' + S + ' cx="12" cy="12" r="9"/><path ' + S + ' d="M12 7.2V12l3.4 2"/>',
    calendar: '<rect ' + S + ' x="3.5" y="5.5" width="17" height="15" rx="2.5"/><path ' + S + ' d="M3.5 10h17M8.5 3.5v4M15.5 3.5v4"/>',
    chevronRight: '<path ' + S + ' d="m9.5 5.5 7 6.5-7 6.5"/>',
    layers: '<path ' + S + ' d="m12 3 8.5 4.5L12 12 3.5 7.5Z"/><path ' + S + ' d="m3.5 12.2 8.5 4.5 8.5-4.5"/><path ' + S + ' d="m3.5 16.7 8.5 4.5 8.5-4.5"/>',
    bolt: '<path ' + S + ' d="M13.5 2.5 4.5 13.8h5.2l-1.2 7.7 9-11.3h-5.2Z"/>',
    star: '<path ' + S + ' d="m12 3.2 2.7 5.6 6.1.85-4.45 4.3 1.1 6.05L12 17.2l-5.45 2.8 1.1-6.05L3.2 9.65l6.1-.85Z"/>',

    /* --- Identity --- */
    idCard: '<rect ' + S + ' x="2.5" y="5" width="19" height="14" rx="2.5"/><circle ' + S + ' cx="8.5" cy="11" r="2.2"/><path ' + S + ' d="M5 16.4a3.6 3.6 0 0 1 7 0M14.5 10h4M14.5 13.5h4"/>',
    badge: '<path ' + S + ' d="M12 3l7 2.8v5.4c0 4.2-2.8 7.5-7 8.8-4.2-1.3-7-4.6-7-8.8V5.8Z"/><path ' + S + ' d="m9 12 2 2 4-4"/>',
    briefcase: '<rect ' + S + ' x="3" y="7.5" width="18" height="12" rx="2"/><path ' + S + ' d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 12.5h18"/>',
    building: '<path ' + S + ' d="M4 21V6.5A1.5 1.5 0 0 1 5.5 5h7A1.5 1.5 0 0 1 14 6.5V21M14 10h4.5A1.5 1.5 0 0 1 20 11.5V21M2.5 21h19"/><path ' + S + ' d="M7 9h4M7 13h4M7 17h4M16.5 14h1M16.5 17.5h1"/>',
    users: '<circle ' + S + ' cx="9.5" cy="8" r="3.6"/><path ' + S + ' d="M3 20a6.5 6.5 0 0 1 13 0"/><path ' + S + ' d="M16.5 5.2a3.2 3.2 0 0 1 0 6.2M18 14.4a5.6 5.6 0 0 1 3.2 5"/>',

    /* --- Services & standards --- */
    shield: '<path ' + S + ' d="M12 3l7 2.8v5.4c0 4.2-2.8 7.5-7 8.8-4.2-1.3-7-4.6-7-8.8V5.8Z"/><path ' + S + ' d="m9 12 2 2 4-4"/>',
    droplet: '<path ' + S + ' d="M12 21a7 7 0 0 1-7-7c0-4.4 7-11 7-11s7 6.6 7 11a7 7 0 0 1-7 7Z"/><path ' + S + ' d="M12 17.5a3.5 3.5 0 0 1-3.5-3.5"/>',
    hardhat: '<path ' + S + ' d="M4.5 16a7.5 7.5 0 0 1 15 0Z"/><path ' + S + ' d="M3 16.5h18v2.2H3zM10 9V6.6A2 2 0 0 1 14 6.6V9"/>',
    lock: '<rect ' + S + ' x="5" y="10.5" width="14" height="10" rx="2"/><path ' + S + ' d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    graduation: '<path ' + S + ' d="M2.5 9 12 4.2 21.5 9 12 13.8Z"/><path ' + S + ' d="M6.5 11.2V17c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-5.8"/>',
    code: '<path ' + S + ' d="M8 8.5 3.5 12 8 15.5M16 8.5 20.5 12 16 15.5M13.5 5l-3 14"/>',
    trending: '<path ' + S + ' d="M3 17.5l6-6 3.5 3.5L21 6.5"/><path ' + S + ' d="M15 6.5h6v6"/>',
    award: '<circle ' + S + ' cx="12" cy="9" r="5.5"/><path ' + S + ' d="m9 13.8-1.5 7L12 18.5l4.5 2.3-1.5-7"/>',
    clipboard: '<path ' + S + ' d="M9 4.5H7.5A1.5 1.5 0 0 0 6 6v13.5A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H15"/><rect ' + S + ' x="9" y="3" width="6" height="3" rx="1"/><path ' + S + ' d="m9.5 13 2 2 3.5-3.8"/>',
    spark: '<path ' + S + ' d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/><path ' + S + ' d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"/>',

    /* --- Theme --- */
    sun: '<circle ' + S + ' cx="12" cy="12" r="4.2"/><path ' + S + ' d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
    moon: '<path ' + S + ' d="M20 14.4A8.5 8.5 0 1 1 9.6 4a6.8 6.8 0 0 0 10.4 10.4Z"/>',

    /* --- Brand marks (solid, so they read correctly at small sizes) --- */
    linkedin: '<path fill="currentColor" d="M4.5 3h15A1.5 1.5 0 0 1 21 4.5v15A1.5 1.5 0 0 1 19.5 21h-15A1.5 1.5 0 0 1 3 19.5v-15A1.5 1.5 0 0 1 4.5 3Zm2.2 6.9v7.6h2.4V9.9H6.7Zm1.2-1.1a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8Zm3.1 1.1v7.6h2.4v-4.1c0-1.1.5-1.7 1.4-1.7s1.3.6 1.3 1.7v4.1h2.4v-4.5c0-2.2-1.1-3.3-2.8-3.3-1.1 0-1.8.5-2.3 1.2V9.9H11Z"/>',
    facebook: '<path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/>',
    instagram: '<rect ' + S + ' x="3" y="3" width="18" height="18" rx="5"/><circle ' + S + ' cx="12" cy="12" r="4"/><circle fill="currentColor" cx="17.2" cy="6.8" r="1.2"/>',
    youtube: '<path ' + S + ' d="M21.2 8.1a2.6 2.6 0 0 0-1.8-1.8C17.8 5.9 12 5.9 12 5.9s-5.8 0-7.4.4A2.6 2.6 0 0 0 2.8 8.1C2.4 9.7 2.4 12 2.4 12s0 2.3.4 3.9a2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.4.4 7.4.4s5.8 0 7.4-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-3.9.4-3.9s0-2.3-.4-3.9Z"/><path fill="currentColor" d="M10.3 15.1V8.9L15.5 12Z"/>'
  };

  function svg(name, className) {
    var body = PATHS[name] || PATHS.spark;
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"' +
      (className ? ' class="' + className + '"' : '') + '>' + body + '</svg>';
  }

  root.DasskIcons = { svg: svg, paths: PATHS, has: function (n) { return !!PATHS[n]; } };
}(typeof window !== 'undefined' ? window : globalThis));

if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).DasskIcons;
}
