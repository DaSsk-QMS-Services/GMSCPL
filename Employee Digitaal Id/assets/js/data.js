/* ============================================================================
   GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED (GMSCPL)
   data.js  ·  SINGLE SOURCE OF TRUTH
   ----------------------------------------------------------------------------
   This is the ONLY file you edit to add, remove or update an employee.

   Consumed by two things, so the site and the generated pages can never drift:
     1. the browser  — assets/js/main.js reads window.GMSCPL_DATA at runtime
     2. the generator — tools/build.mjs reads this same file to write the
        static employee pages, .vcf contact files and monogram avatars

   ---------------------------------------------------------------------------
   TO ADD A NEW EMPLOYEE
     1. Add one entry to the EMPLOYEES array below (id, name, designation,
        phone, email are the only required fields).
     2. If the designation is new, add a matching entry to DESIGNATIONS so the
        bio, skill badges and enquiry topics are written for it.
     3. Drop their photograph into employees/<id-lower-case>/ — any name, any
        of .jpg .jpeg .png .webp .avif. The generator finds it automatically,
        so `photo` below is only needed when a folder holds several images and
        you want to pin one. If no photo is present (or the file fails to load
        in the browser) a branded monogram of their initials is shown instead.
     4. Run:  node tools/build.mjs

   NOTE ON QR CODES
     This site no longer renders or downloads QR codes. The printed codes on
     the physical ID cards are produced manually, after deployment, from each
     employee's profile URL — see README section 3. All that matters here is
     that the folder name matches the ID printed on the card, so the code you
     generate for GMS-P-0001 resolves to /employees/gms-p-0001/.

   Sections
     01  Company (header, footer, socials, brochure, offices, hours)
     02  Enquiry templates (the professional pre-filled messages)
     03  Designation profiles (bio + skills + highlights, one per job title)
     04  Employees
     05  Derived helpers shared by the browser and the generator
   ========================================================================== */
(function (root) {
  'use strict';

  /* --- 01 · Company -------------------------------------------------------
     Facts below are taken from the GST REG-06 certificate, Annexure A,
     Annexure B, and the company business card. Nothing here is invented. */
  var COMPANY = {
    name: 'GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED (GMSCPL)',
    legalName: 'GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED',
    tradeName: 'GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED',
    shortName: 'GMSCPL',
    tagline: 'Management Systems Certification',
    website: 'https://www.gmscpl.com',
    websiteLabel: 'www.gmscpl.com',
    since: '08 September 2026',
    idPrefix: 'GMS-P',

    /* Official mark from https://gmscpl.com/og/gmscpl-logo-512.png */
    logo: 'assets/images/logo.png',
    logoFallback: 'assets/images/logo.png',
    logoRatio: 1,

    /* Company line printed on the business card. */
    phone: '9581902416',
    email: 'admin@gmscpl.com',
    emails: [
      { label: 'Admin', address: 'admin@gmscpl.com' },
      { label: 'Customer service', address: 'customerservice@gmscpl.com' }
    ],

    /* Deployment origin. Used for canonical URLs, sitemap, OG tags and the
       vCard profile URL. */
    origin: 'https://www.gmscpl.com',
    basePath: '/',

    /* Principal place of business — GST REG-06, confirmed on the business card.
       The certificate types "FALT"; the card spells Flat No. 503. */
    address: {
      floor: '5th',
      premises: '5th Floor, Flat No. 503, Balsiddi Heights',
      street: 'Road No. 14, Banjara Hills',
      locality: 'Hyderabad',
      district: 'Hyderabad',
      region: 'Telangana',
      postalCode: '500034',
      country: 'India',
      countryCode: 'IN'
    },
    mapQuery: 'Balsiddi Heights, Road No. 14, Banjara Hills, Hyderabad, Telangana 500034, India',

    offices: [
      {
        kind: 'Principal Place of Business',
        icon: 'building',
        floor: '5th',
        premises: '5th Floor, Flat No. 503, Balsiddi Heights',
        street: 'Road No. 14, Banjara Hills',
        locality: 'Hyderabad',
        district: 'Hyderabad',
        region: 'Telangana',
        postalCode: '500034',
        country: 'India',
        mapQuery: 'Balsiddi Heights, Road No. 14, Banjara Hills, Hyderabad, Telangana 500034, India'
      }
    ],

    /* Published on gmscpl.com: Mon – Sat, 9:30 AM – 6:30 PM IST. */
    hours: [
      { days: 'Monday – Saturday', time: '9:30 AM – 6:30 PM IST', open: true },
      { days: 'Sunday', time: 'Closed', open: false }
    ],

    description: 'GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED (GMSCPL) ' +
      'is a private limited company registered for management systems certification. ' +
      'GSTIN 36AANCG2169G1ZE. The principal place of business is 5th Floor, Flat No. 503, ' +
      'Balsiddi Heights, Road No. 14, Banjara Hills, Hyderabad, Telangana 500034.',

    /* No company brochure was supplied. Employee-detail PDFs are printed from
       each digital ID card. */
    brochure: null,
    brochureLabel: null,

    socials: [
      { brand: 'globe', label: 'Website', note: 'www.gmscpl.com', url: 'https://www.gmscpl.com' }
    ],

    /* Registration block — Form GST REG-06 and Annexure A. */
    registration: {
      gstin: '36AANCG2169G1ZE',
      legalName: 'GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED',
      tradeName: 'GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED',
      constitution: 'Private Limited Company',
      registrationType: 'Regular',
      certificateDate: '08/09/2026',
      validFrom: '08/09/2026',
      validTo: 'Not Applicable',
      additionalPlaces: 0,
      additionalTradeNames: ''
    },

    services: [
      { icon: 'shield',    name: 'Management Systems Certification', note: 'Certification of organisational management systems' },
      { icon: 'award',     name: 'Certification Enquiries',          note: 'Scope, process and next steps with the company' },
      { icon: 'search',    name: 'Assessment',                        note: 'Assessment against the applicable management system' },
      { icon: 'clipboard', name: 'GST Registration',                  note: 'Regular · GSTIN 36AANCG2169G1ZE · issued 08/09/2026' }
    ]
  };

  /* --- 02 · Enquiry templates ---------------------------------------------
     The point of a digital ID card is that the person holding the phone does
     not have to compose anything. Every WhatsApp, email and call action on a
     card carries one of these ready-written professional messages, addressed
     to that employee by name and quoting their employee ID.

     Placeholders, substituted per employee:
       {first}  {name}  {id}  {designation}  {company}  {site}
     `subject` is used for email only; `intro` + `body` are shared, so the
     WhatsApp message and the email say the same thing in the right shape. */
  var ENQUIRIES = [
    {
      key: 'general',
      icon: 'spark',
      label: 'General enquiry',
      note: 'Introduce yourself and ask how we can help',
      subject: 'Business enquiry via {company} digital ID card ({id})',
      intro: 'I came across your {company} digital ID card ({id}) and would like to connect with you.',
      body: 'Could you share how {company} handles management systems certification, and the best way ' +
        'to start an enquiry? I would be glad to arrange a short call at a time that suits you.'
    },
    {
      key: 'certification',
      icon: 'shield',
      label: 'Certification enquiry',
      note: 'Ask about management systems certification',
      subject: 'Management systems certification — enquiry via {company} ID card ({id})',
      intro: 'I am contacting you through your {company} digital ID card ({id}) about management systems certification.',
      body: 'We would like to understand the certification process, the information you need from us, ' +
        'and an indicative timeline. Please let me know how to share our organisation details.'
    },
    {
      key: 'assessment',
      icon: 'search',
      label: 'Assessment',
      note: 'Ask about an assessment visit or review',
      subject: 'Assessment enquiry via {company} ID card ({id})',
      intro: 'I found your {company} digital ID card ({id}) and would like to discuss an assessment.',
      body: 'Could you explain how an assessment is arranged, what is reviewed, and what we should ' +
        'prepare before the visit?'
    },
    {
      key: 'quote',
      icon: 'file',
      label: 'Request a quotation',
      note: 'Ask for a written proposal and pricing',
      subject: 'Request for quotation — via {company} ID card ({id})',
      intro: 'I am contacting you through your {company} digital ID card ({id}) to request a quotation.',
      body: 'Please could you send a written proposal covering scope, deliverables, timeline and ' +
        'commercial terms for the certification we discuss? I will share our requirement details on your reply.'
    }
  ];

  /* --- 03 · Designation profiles ------------------------------------------
     One entry per job title. `bio`, `skills` and `highlights` are written
     straight onto the employee's page, so every designation reads differently.
     `topics` lists the enquiry keys most relevant to that role — those message
     templates are shown first on their card. Keyed by the exact `designation`
     string used in EMPLOYEES below. */
  var DESIGNATIONS = {
    'Partner': {
      department: 'Partners',
      topics: ['general', 'certification', 'quote', 'assessment'],
      bio: 'Partner of GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED (GMSCPL), ' +
        'as recorded on the company GST registration. The principal place of business is ' +
        '5th Floor, Flat No. 503, Balsiddi Heights, Road No. 14, Banjara Hills, Hyderabad, ' +
        'Telangana 500034.',
      skills: ['Partner', 'Management Systems Certification', 'Client Enquiries'],
      highlights: [
        'Partner of GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED (GMSCPL)',
        'Listed with designation Partner on the company GST registration',
        'Company GSTIN 36AANCG2169G1ZE',
        'Principal place of business in Banjara Hills, Hyderabad'
      ]
    }
  };

  /* --- 04 · Employees ----------------------------------------------------
     `id`          printed on the physical ID card; also the folder name
                   (lower-cased), so a printed DQS-P-0003 resolves to
                   /employees/dqs-p-0003/
     `linkedin`    per-employee LinkedIn profile, shown beside the name.
                   Leave as null until the real profile URL is known.
     `photo`       normally null — the generator picks up whatever image is in
                   the employee's folder. Set it only to pin one specific file
                   when a folder contains more than one image. */
  /* People recorded on GST Annexure B, plus the contact lines printed on
     SriTeja Telaprolu's business card. Phone and email stay empty when the
     documents do not give a personal number — the card then shows the company
     line and says so. */
  var EMPLOYEES = [
    {
      id: 'GMS-P-0001',
      name: 'SriTeja Telaprolu',
      greeting: 'SriTeja',
      designation: 'Partner',
      residentState: 'Telangana',
      phone: '9581902416',
      email: 'admin@gmscpl.com',
      emails: ['admin@gmscpl.com', 'customerservice@gmscpl.com'],
      linkedin: null,
      photo: null,
      bio: 'Partner of GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED (GMSCPL) ' +
        'and resident of Telangana. The company business card lists this name with ' +
        'phone 9581902416, admin@gmscpl.com and customerservice@gmscpl.com, at the ' +
        'registered office in Banjara Hills, Hyderabad.',
      highlights: [
        'Partner, resident of Telangana',
        'Phone 9581902416, as printed on the company business card',
        'Admin and customer-service email on the same card',
        'Principal place of business in Banjara Hills, Hyderabad'
      ]
    },
    {
      id: 'GMS-P-0002',
      name: 'Chitikala Siva Ranjani',
      greeting: 'Siva Ranjani',
      designation: 'Partner',
      residentState: 'Andhra Pradesh',
      phone: null,
      email: null,
      linkedin: null,
      photo: null,
      bio: 'Partner of GLOBAL MANAGEMENT SYSTEMS CERTIFICATION PRIVATE LIMITED (GMSCPL) ' +
        'and resident of Andhra Pradesh, as recorded on the company GST registration. ' +
        'A personal phone number and email are not printed on the certificate or the ' +
        'business card, so this profile uses the company line.',
      highlights: [
        'Partner, resident of Andhra Pradesh',
        'Listed with designation Partner on the company GST registration',
        'Company GSTIN 36AANCG2169G1ZE',
        'Enquiries go through the company phone and email on this card'
      ]
    }
  ];

  /* --- 05 · Derived helpers ----------------------------------------------
     Everything below is computed, never hand-maintained. Both the browser and
     the build script use these, so a phone number is formatted identically in
     the page, the vCard and the WhatsApp link. */

  /* '9360687242' -> '+919360687242' (E.164, for tel: and wa.me) */
  function e164(phone) {
    if (!phone) return '';
    var digits = String(phone).replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return '+91' + digits;          // Indian mobile
    return '+' + digits.replace(/^0+/, '');
  }

  /* '9360687242' -> '+91 93606 87242' (human readable) */
  function phoneLabel(phone) {
    if (!phone) return '';
    var digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) {
      return '+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5);
    }
    return e164(phone);
  }

  /* Personal number when the record has one, otherwise the company line. */
  function reachPhone(employee) {
    return (employee && employee.phone) ? employee.phone : COMPANY.phone;
  }

  function reachEmail(employee) {
    return (employee && employee.email) ? employee.email : COMPANY.email;
  }

  /* digits only, as wa.me requires: '919360687242' */
  function waNumber(phone) {
    return e164(phone).replace(/\D/g, '');
  }

  /* 'DQS-P-0001' -> 'dqs-p-0001' (folder name, matching the printed card) */
  function slug(id) {
    return String(id).toLowerCase();
  }

  /* 'Mohamed Yasar Ali J.' -> 'MY'  ·  'Swetha' -> 'S' */
  function initials(name) {
    var parts = String(name).replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(/\s+/)
      .filter(function (p) { return /[A-Za-z]/.test(p); });
    var first = (parts[0] || '?').charAt(0);
    var second = parts.length > 1 ? parts[1].charAt(0) : '';
    return (first + second).toUpperCase();
  }

  /* First name, for the greeting in every message template. */
  function firstName(nameOrEmployee) {
    if (nameOrEmployee && typeof nameOrEmployee === 'object') {
      if (nameOrEmployee.greeting) return nameOrEmployee.greeting;
      nameOrEmployee = nameOrEmployee.name;
    }
    var cleaned = String(nameOrEmployee || '').replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').trim();
    return cleaned.split(/\s+/)[0] || cleaned;
  }

  /* Deterministic brand gradient per employee, so an avatar and the accent
     ring around a photo always look the same after every rebuild. */
  var AVATAR_GRADIENTS = [
    ['#0c2348', '#1d4e9f'],
    ['#0a1b3a', '#c6a15b'],
    ['#12315f', '#d4b06a'],
    ['#0c2348', '#3d6ec4']
  ];

  function gradientFor(id) {
    var sum = 0;
    for (var i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
  }

  /* Google Maps search link ("Office location"). */
  function mapsUrl(query) {
    return 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(query || COMPANY.mapQuery);
  }

  /* Google Maps turn-by-turn link ("Navigate"). Opens the native app on a
     phone, so the visitor gets directions rather than just a pin. */
  function directionsUrl(query) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(query || COMPANY.mapQuery);
  }

  function addressLine(office) {
    var a = office || COMPANY.address;
    var parts = [];
    if (a.premises) parts.push(a.premises);
    if (a.street) parts.push(a.street);
    parts.push(a.locality + ', ' + a.region + ' ' + a.postalCode);
    parts.push(a.country);
    return parts.join(', ');
  }

  /* Absolute, canonical URL of an employee's card. This is the address the
     manually generated QR code for that employee must encode. */
  function profileUrl(employee) {
    return COMPANY.origin + COMPANY.basePath + 'employees/' + slug(employee.id) + '/';
  }

  /* --- Message templates -------------------------------------------------- */

  function fillTemplate(text, employee) {
    return String(text)
      .replace(/\{first\}/g, firstName(employee))
      .replace(/\{name\}/g, employee.name)
      .replace(/\{id\}/g, employee.id)
      .replace(/\{designation\}/g, employee.designation)
      .replace(/\{company\}/g, COMPANY.name)
      .replace(/\{site\}/g, COMPANY.websiteLabel);
  }

  function enquiryByKey(key) {
    for (var i = 0; i < ENQUIRIES.length; i++) {
      if (ENQUIRIES[i].key === key) return ENQUIRIES[i];
    }
    return ENQUIRIES[0];
  }

  /* Short enough that wa.me and WhatsApp Web accept the link. */
  function whatsappText(employee, key) {
    var t = enquiryByKey(key);
    return fillTemplate(
      'Hello {first}, this is a ' + t.label.toLowerCase() +
      ' from your GMSCPL ID card ({id}). Please reply when you can.',
      employee
    );
  }

  function whatsappUrl(employee, key) {
    return 'https://wa.me/' + waNumber(reachPhone(employee)) +
      '?text=' + encodeURIComponent(whatsappText(employee, key));
  }

  /* A properly laid-out email: real subject, greeting, body and sign-off. */
  function emailSubject(employee, key) {
    return fillTemplate(enquiryByKey(key).subject, employee);
  }

  function emailBody(employee, key) {
    var t = enquiryByKey(key);
    return fillTemplate(
      'Dear {first},\n\n' + t.intro + '\n\n' + t.body + '\n\n' +
      'Looking forward to your reply.\n\n' +
      'Best regards,\n[Your name]\n[Your company]\n[Your phone]\n',
      employee
    );
  }

  function emailUrl(employee, key) {
    return 'mailto:' + reachEmail(employee) +
      '?subject=' + encodeURIComponent(emailSubject(employee, key)) +
      '&body=' + encodeURIComponent(emailBody(employee, key));
  }

  /* The employee's enquiry templates, most relevant to their role first. */
  function enquiriesFor(employee) {
    var profile = DESIGNATIONS[employee.designation];
    var preferred = (profile && profile.topics) || [];
    var ordered = [];
    var seen = {};

    preferred.concat(ENQUIRIES.map(function (t) { return t.key; }))
      .forEach(function (key) {
        if (seen[key]) return;
        seen[key] = true;
        ordered.push(enquiryByKey(key));
      });

    return ordered.map(function (t) {
      return {
        key: t.key,
        icon: t.icon,
        label: t.label,
        note: t.note,
        whatsappUrl: whatsappUrl(employee, t.key),
        emailUrl: emailUrl(employee, t.key),
        whatsappText: whatsappText(employee, t.key),
        emailSubject: emailSubject(employee, t.key)
      };
    });
  }

  /* Merge an employee record with its designation profile + derived fields.
     This is what pages and the generator actually render from. */
  function resolve(employee) {
    var profile = DESIGNATIONS[employee.designation] || {
      department: employee.designation,
      bio: employee.name + ' is part of ' + COMPANY.name + '.',
      skills: [],
      highlights: [],
      topics: []
    };

    var directPhone = employee.phone || null;
    var directEmail = employee.email || null;
    var emails = (employee.emails && employee.emails.length)
      ? employee.emails.slice()
      : (directEmail ? [directEmail] : []);

    return {
      id: employee.id,
      slug: slug(employee.id),
      name: employee.name,
      firstName: firstName(employee),
      initials: initials(employee.name),
      designation: employee.designation,
      department: profile.department,
      residentState: employee.residentState || null,
      bio: employee.bio || profile.bio,
      skills: profile.skills,
      highlights: (employee.highlights && employee.highlights.length)
        ? employee.highlights
        : profile.highlights,
      status: 'Active',

      phone: directPhone,
      phoneDirect: !!directPhone,
      phoneE164: directPhone ? e164(directPhone) : null,
      phoneLabel: directPhone ? phoneLabel(directPhone) : null,
      reachPhone: reachPhone(employee),
      reachPhoneE164: e164(reachPhone(employee)),
      reachPhoneLabel: phoneLabel(reachPhone(employee)),
      email: directEmail,
      emailDirect: !!directEmail,
      emails: emails,
      reachEmail: reachEmail(employee),
      linkedin: employee.linkedin || null,

      /* `photo` is the image actually rendered; `avatar` is the generated
         monogram that every folder always has, used as the fallback when a
         photograph is missing or fails to load. tools/build.mjs overwrites
         `photo`/`hasPhoto` when it finds an image in the folder. */
      photo: employee.photo || 'avatar.svg',
      avatar: 'avatar.svg',
      hasPhoto: !!employee.photo,

      telUrl: 'tel:' + e164(reachPhone(employee)),
      whatsappUrl: whatsappUrl(employee, 'general'),
      emailUrl: emailUrl(employee, 'general'),
      enquiries: enquiriesFor(employee),
      profileUrl: profileUrl(employee),
      gradient: gradientFor(employee.id)
    };
  }

  function all() {
    return EMPLOYEES.map(resolve);
  }

  function byId(id) {
    var wanted = String(id).toUpperCase();
    for (var i = 0; i < EMPLOYEES.length; i++) {
      if (EMPLOYEES[i].id.toUpperCase() === wanted) return resolve(EMPLOYEES[i]);
    }
    return null;
  }

  var api = {
    company: COMPANY,
    designations: DESIGNATIONS,
    enquiries: ENQUIRIES,
    employees: EMPLOYEES,
    // helpers
    all: all,
    byId: byId,
    resolve: resolve,
    slug: slug,
    initials: initials,
    firstName: firstName,
    e164: e164,
    phoneLabel: phoneLabel,
    waNumber: waNumber,
    reachPhone: reachPhone,
    reachEmail: reachEmail,
    mapsUrl: mapsUrl,
    directionsUrl: directionsUrl,
    addressLine: addressLine,
    profileUrl: profileUrl,
    gradientFor: gradientFor,
    whatsappUrl: whatsappUrl,
    emailUrl: emailUrl,
    enquiriesFor: enquiriesFor
  };

  root.GMSCPL_DATA = api;
  /* Alias kept so any page that still asks for the previous global keeps working. */
  root.DASSK_DATA = api;
}(typeof window !== 'undefined' ? window : globalThis));

/* Node (build script) access — the browser ignores this. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).GMSCPL_DATA;
}
