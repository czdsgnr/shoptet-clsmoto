/* =========================================================
   Shoptet úpravy – CLSmoto (clsmoto.cz)
   Hostováno na GitHub Pages, viz README.

   Moduly:
     A) Karta majitele „Osobně ručím za Vaši spokojenost"
        (staví HTML a vkládá ho na HP nad blok Doporučené)
     B) Anti-overflow pojistka na mobilu (přeneseno z patičky)
     C) Rozbalovací „Technické údaje" v pravém sloupci detailu
     D) Formulář pro odstoupení od smlouvy na /odstoupeni-od-smlouvy/
   ========================================================= */
(function () {
  'use strict';

  /* === A) Karta majitele ==============================================
     PROČ PŘEPSANÉ: původní skript hledal jeden kontejner, který by
     obsahoval texty „Doporučené" + „Akční zboží" + „Novinky" zároveň
     a měl přitom < 300 znaků. Motiv ale každou skupinu renderuje zvlášť
     (samostatné .homepage-group-title jako přímé děti main.content), takže
     se nikdy nic nenašlo → karta zůstala viset na začátku <body> s
     display:none a na webu ji nikdo neviděl (ověřeno 30. 7. 2026).
     Teď se kotvíme na první .homepage-group-title na homepage. */

  var OWNER = {
    photo: 'https://www.clsmoto.cz/user/shop/big/327-1.jpg?69fc5fc4',
    name: 'Petr Stehlík',
    role: 'zakladatel Clsmoto.cz',
    heading: 'Osobně ručím za Vaši spokojenost',
    paragraphs: [
      'Věříme, že dobrá jízda začíná u kvalitního skútru. Proto nabízíme takové skútry a značky, které dlouhodobě používáme sami.',
      'Pokud nebudete spokojeni se zakoupenými výrobky, ozvěte se – vše vyřešíme rychle, lidsky a férově.'
    ]
  };

  var ownerCard = null;

  function isHomepage() {
    var c = document.body ? document.body.className : '';
    return /(^|\s)(type-index|in-index)(\s|$)/.test(c);
  }

  /* Kartu buď převezmeme z DOM (pokud ještě zůstala v <head> ze starého
     kódu – pak ji jen přesuneme, nevyrábíme duplikát), nebo ji postavíme
     a držíme si na ni referenci. */
  function getOwnerCard() {
    if (ownerCard) return ownerCard;

    var existing = document.getElementById('cls-owner-move');
    if (existing) { ownerCard = existing; return existing; }

    var card = document.createElement('div');
    card.id = 'cls-owner-move';

    var circle = document.createElement('div');
    circle.className = 'cls-owner-circle';
    var img = document.createElement('img');
    img.src = OWNER.photo;
    img.alt = OWNER.name;
    img.loading = 'lazy';
    circle.appendChild(img);

    var text = document.createElement('div');
    text.className = 'cls-owner-text';

    var h2 = document.createElement('h2');
    h2.textContent = OWNER.heading;
    text.appendChild(h2);

    OWNER.paragraphs.forEach(function (t) {
      var p = document.createElement('p');
      p.textContent = t;
      text.appendChild(p);
    });

    var nameRow = document.createElement('div');
    nameRow.className = 'cls-owner-name';
    nameRow.appendChild(document.createTextNode('— ' + OWNER.name + ' '));
    var role = document.createElement('span');
    role.style.cssText = 'font-weight:400;color:#888;margin-left:8px';
    role.textContent = OWNER.role;
    nameRow.appendChild(role);
    text.appendChild(nameRow);

    card.appendChild(circle);
    card.appendChild(text);
    ownerCard = card;
    return card;
  }

  /* Kotva = první nadpis skupiny produktů na HP („Doporučené").
     Fallback: nadpis, jehož text sedí, kdyby motiv třídu změnil. */
  function findAnchor() {
    var byClass = document.querySelector('main.content .homepage-group-title, .content .homepage-group-title');
    if (byClass) return byClass;

    var heads = document.querySelectorAll('main.content h1, main.content h2, main.content h3, main.content h4, main.content .h4');
    for (var i = 0; i < heads.length; i++) {
      var t = (heads[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (t === 'Doporučené' || t === 'Akční zboží' || t === 'Novinky') return heads[i];
    }
    return null;
  }

  function placeOwnerCard() {
    var card = getOwnerCard();
    if (card.dataset.done === '1') return true;

    var anchor = findAnchor();
    if (!anchor) return false;

    anchor.parentNode.insertBefore(card, anchor);
    card.style.display = 'flex';
    card.dataset.done = '1';
    return true;
  }

  function initOwnerCard() {
    if (!isHomepage()) return;
    if (placeOwnerCard()) return;

    /* Skupiny produktů se dorenderují až po AJAXu → chvíli to zkoušíme (max 6 s). */
    var tries = 0;
    var timer = setInterval(function () {
      if (placeOwnerCard() || ++tries > 20) clearInterval(timer);
    }, 300);
  }


  /* === B) Anti-overflow pojistka (jen mobil) ==========================
     CSS overflow-x:hidden řeší většinu; tohle dokrotí konkrétní prvky,
     které fyzicky přetékají. Na desktopu neběží – agresivní ořez tam
     zavíral roletky v menu. */

  var PROTECTED = [
    '.gallery', '.product-gallery', '.p-detail',
    '.navigation-wrapper', '#navigation', '.swiper-container'
  ].join(', ');

  function fixMobileOverflow() {
    if (window.innerWidth > 992) return;

    var containers = document.querySelectorAll('section, div.container, header, footer, table');
    Array.prototype.forEach.call(containers, function (el) {
      if (el.closest(PROTECTED)) return;
      if (el.offsetWidth > window.innerWidth) {
        el.style.maxWidth = '100%';
        el.style.boxSizing = 'border-box';
        el.style.overflowX = 'hidden';
      }
    });
  }



  /* === C) Rozbalovací „Technické údaje" na detailu ====================
     Klient (30. 7. 2026): tabulka technických údajů byla až dole v popisu
     (~3000 px od začátku stránky), uživatel se k ní musel proscrollovat.
     Přesouváme ji proto do pravého sloupce pod krátký popis a schováváme
     do rozbalovačky, která vzhledem kopíruje nativní taby motivu.

     POZOR NA TIMING: paxio-merkur staví .p-info-wrapper (nadpis, skladovost,
     buy-box) až vlastním JS po DOMContentLoaded. Když do toho sáhneme dřív,
     motivu se přesun rozhodí a celý pravý sloupec se nedostaví – proto
     detailReady() strážce (stejná past jako na svetzarovek.eu). */

  var pageLoaded = false;
  window.addEventListener('load', function () { pageLoaded = true; });

  function isProductDetail() {
    var c = document.body ? document.body.className : '';
    return /(^|\s)type-product(\s|$)/.test(c);
  }

  /* Motiv je hotový, až má nadpis v pravém sloupci; pojistka = window load. */
  function detailReady() {
    if (document.querySelector('.p-info-wrapper .p-detail-inner-header')) return true;
    return pageLoaded;
  }

  /* 1) podle popisku tabulky („Technické údaje"),
     2) fallback: dvousloupcová tabulka, kde většina buněk v prvním sloupci
        končí dvojtečkou (= parametr: hodnota) – kdyby popisek chyběl. */
  function findSpecsTable() {
    var tables = document.querySelectorAll('#description table, .basic-description table');
    var i, t;

    for (i = 0; i < tables.length; i++) {
      t = tables[i];
      if (t.classList.contains('size-table') || t.classList.contains('detail-parameters')) continue;
      var cap = t.querySelector('caption');
      if (cap && /technick/i.test(cap.textContent || '')) return t;
    }

    for (i = 0; i < tables.length; i++) {
      t = tables[i];
      if (t.classList.contains('size-table') || t.classList.contains('detail-parameters')) continue;
      if (t.rows.length < 8 || !t.rows[0] || t.rows[0].cells.length !== 2) continue;
      var labelLike = 0;
      for (var r = 0; r < t.rows.length; r++) {
        var first = t.rows[r].cells[0];
        if (first && /:\s*$/.test((first.textContent || '').trim())) labelLike++;
      }
      if (labelLike / t.rows.length >= 0.6) return t;
    }
    return null;
  }

  function buildSpecsToggle() {
    if (document.querySelector('.cls-specs')) return true;

    var wrap = document.querySelector('.p-info-wrapper');
    if (!wrap) return false;

    var table = findSpecsTable();
    /* Produkt bez takové tabulky – není co přesouvat, hotovo. */
    if (!table) return true;

    var cap = table.querySelector('caption');
    var label = cap && (cap.textContent || '').trim() ? cap.textContent.trim() : 'Technické údaje';

    var box = document.createElement('div');
    box.className = 'cls-specs';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cls-specs__toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'cls-specs-panel');
    var labelEl = document.createElement('span');
    labelEl.textContent = label;
    btn.appendChild(labelEl);

    var panel = document.createElement('div');
    panel.className = 'cls-specs__panel';
    panel.id = 'cls-specs-panel';

    var inner = document.createElement('div');
    inner.className = 'cls-specs__inner';
    inner.appendChild(table);          /* přesun, ne kopie – obsah zůstane na stránce 1× */
    panel.appendChild(inner);

    box.appendChild(btn);
    box.appendChild(panel);

    var anchor = wrap.querySelector('.p-short-description') ||
                 wrap.querySelector('.detail-parameters') ||
                 wrap.querySelector('.availability-value');

    if (anchor && anchor.parentNode === wrap) {
      wrap.insertBefore(box, anchor.nextSibling);
    } else {
      wrap.appendChild(box);
    }

    btn.addEventListener('click', function () {
      var open = box.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    return true;
  }

  function initSpecsToggle() {
    if (!isProductDetail()) return;

    var tries = 0;
    var timer = setInterval(function () {
      if (detailReady() && buildSpecsToggle()) { clearInterval(timer); return; }
      if (++tries > 40) clearInterval(timer);   /* max 8 s */
    }, 200);
  }



  /* === D) Formulář pro odstoupení od smlouvy ==========================
     Stránka /odstoupeni-od-smlouvy/ měla jen text s odkazem na „vzorový
     formulář poskytnutý prodávajícím". Doplňujeme skutečný formulář podle
     vzoru z nařízení vlády č. 363/2013 Sb. (§ 1829 obč. zák. – odstoupení
     do 14 dnů).

     ODESÍLÁNÍ: klasickým POSTem na nativní Shoptet endpoint kontaktního
     formuláře `/action/MailForm/SendEmail/` (formId=1, stejný jako na
     /kontakty/) → zpráva dorazí obvyklou cestou do schránky obchodu a
     Shoptet po odeslání sám zobrazí své potvrzení. Žádná externí služba,
     žádné mailto (to na desktopu bez nastaveného klienta neudělá nic).
     Viditelná pole schválně NEMAJÍ atribut name – odesílá se jen to, co
     endpoint zná (fullName, email, message, consents[], honeypot surname);
     všechny údaje se před odesláním složí do `message`. */

  var WITHDRAWAL_PATH = '/odstoupeni-od-smlouvy/';

  var SELLER = [
    'CLS DEAL s.r.o.',
    'Široká 241/25, 251 01 Říčany',
    'IČ: 28260864, DIČ: CZ28260864',
    'info@clsmoto.cz'
  ];

  /* [id, popisek, typ, povinné] */
  var FIELDS = [
    ['name',     'Jméno a příjmení',                    'text',     true],
    ['address',  'Adresa (ulice, město, PSČ)',           'text',     true],
    ['email',    'E-mail',                              'email',    true],
    ['phone',    'Telefon',                             'tel',      false],
    ['order',    'Číslo objednávky',                     'text',     true],
    ['ordered',  'Datum objednání',                     'date',     true],
    ['received', 'Datum převzetí zboží',                'date',     true],
    ['goods',    'Zboží, kterého se odstoupení týká',   'textarea', true],
    ['account',  'Číslo účtu pro vrácení peněz',        'text',     true],
    ['note',     'Poznámka (nepovinné)',                'textarea', false]
  ];

  function isWithdrawalPage() {
    var path = location.pathname.replace(/\/+$/, '/');
    if (path.charAt(path.length - 1) !== '/') path += '/';
    return path === WITHDRAWAL_PATH;
  }

  function field(id, label, type, required) {
    var group = document.createElement('div');
    group.className = 'form-group cls-wd__group' + (type === 'textarea' ? ' cls-wd__group--wide' : '');

    var lab = document.createElement('label');
    lab.setAttribute('for', 'cls-wd-' + id);
    lab.textContent = label;
    if (required) {
      var star = document.createElement('span');
      star.className = 'cls-wd__req';
      star.textContent = ' *';
      lab.appendChild(star);
    }

    var input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    else input.rows = 3;
    input.id = 'cls-wd-' + id;
    input.className = 'form-control';
    if (required) input.required = true;

    group.appendChild(lab);
    group.appendChild(input);
    return group;
  }

  function val(id) {
    var el = document.getElementById('cls-wd-' + id);
    return el ? el.value.trim() : '';
  }

  function czDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? (+p[2]) + '. ' + (+p[1]) + '. ' + p[0] : iso;
  }

  function composeMessage() {
    var lines = [
      'ODSTOUPENÍ OD KUPNÍ SMLOUVY (do 14 dnů, § 1829 obč. zák.)',
      '',
      'Adresát: ' + SELLER.join(', '),
      '',
      'Oznamuji, že tímto odstupuji od smlouvy o nákupu tohoto zboží:',
      val('goods'),
      '',
      'Číslo objednávky / faktury: ' + val('order'),
      'Datum objednání: ' + czDate(val('ordered')),
      'Datum převzetí zboží: ' + czDate(val('received')),
      '',
      'Spotřebitel: ' + val('name'),
      'Adresa: ' + val('address'),
      'E-mail: ' + val('email'),
      'Telefon: ' + (val('phone') || '–'),
      '',
      'Peníze vraťte na účet: ' + val('account')
    ];

    if (val('note')) lines.push('', 'Poznámka: ' + val('note'));

    lines.push('', 'Odesláno z formuláře na ' + location.origin + WITHDRAWAL_PATH +
                   ' dne ' + new Date().toLocaleString('cs-CZ'));
    return lines.join('\n');
  }

  function hidden(form, name, value) {
    var i = document.createElement('input');
    i.type = 'hidden';
    i.name = name;
    i.value = value;
    form.appendChild(i);
    return i;
  }

  function buildWithdrawalForm() {
    if (document.querySelector('.cls-wd')) return;

    var article = document.querySelector('.pageArticleDetail') ||
                  document.querySelector('.content-inner') ||
                  document.querySelector('main#content');
    if (!article) return;

    var box = document.createElement('section');
    box.className = 'cls-wd';

    var h = document.createElement('h2');
    h.className = 'cls-wd__title';
    h.textContent = 'Formulář pro odstoupení od smlouvy';
    box.appendChild(h);

    var intro = document.createElement('p');
    intro.className = 'cls-wd__intro';
    intro.textContent = 'Vyplňte formulář a odešlete jedním tlačítkem. Odstoupení tím ' +
      'oznámíte prodávajícímu ve lhůtě 14 dnů od převzetí zboží. Zboží pak zašlete ' +
      'nebo předejte do 14 dnů od tohoto oznámení.';
    box.appendChild(intro);

    var addr = document.createElement('p');
    addr.className = 'cls-wd__seller';
    addr.innerHTML = '<strong>Adresát:</strong><br>' + SELLER.join('<br>');
    box.appendChild(addr);

    var form = document.createElement('form');
    form.className = 'cls-wd__form';
    form.action = '/action/MailForm/SendEmail/';
    form.method = 'post';

    var grid = document.createElement('div');
    grid.className = 'cls-wd__grid';
    FIELDS.forEach(function (f) { grid.appendChild(field(f[0], f[1], f[2], f[3])); });
    form.appendChild(grid);

    /* Souhlas – stejné znění i cíl jako u nativního kontaktního formuláře */
    var consent = document.createElement('label');
    consent.className = 'cls-wd__consent';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = 'cls-wd-consent';
    cb.required = true;
    var cText = document.createElement('span');
    cText.innerHTML = 'Souhlasím s <a href="/podminky-ochrany-osobnich-udaju/" ' +
      'rel="noopener noreferrer">podmínkami ochrany osobních údajů</a>. <span class="cls-wd__req">*</span>';
    consent.appendChild(cb);
    consent.appendChild(cText);
    form.appendChild(consent);

    var actions = document.createElement('div');
    actions.className = 'cls-wd__actions';
    var btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'btn btn-primary cls-wd__submit';
    btn.textContent = 'Odeslat odstoupení od smlouvy';
    actions.appendChild(btn);
    form.appendChild(actions);

    /* Skryté pole, která zná endpoint (viditelná pole name nemají) */
    hidden(form, 'formId', '1');
    hidden(form, 'surname', '');                    /* honeypot – musí zůstat prázdný */
    var hName = hidden(form, 'fullName', '');
    var hMail = hidden(form, 'email', '');
    var hMsg = hidden(form, 'message', '');
    var hConsent = hidden(form, 'consents[]', '40');

    form.addEventListener('submit', function (e) {
      if (!form.reportValidity()) { e.preventDefault(); return; }
      hName.value = val('name');
      hMail.value = val('email');
      hMsg.value = composeMessage();
      hConsent.disabled = !cb.checked;
      btn.disabled = true;
      btn.textContent = 'Odesílám…';
    });

    box.appendChild(form);
    article.appendChild(box);
  }

  function initWithdrawalForm() {
    if (!isWithdrawalPage()) return;
    buildWithdrawalForm();
  }


  /* === Start ========================================================== */

  function init() {
    initOwnerCard();
    initSpecsToggle();
    initWithdrawalForm();
    fixMobileOverflow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', fixMobileOverflow);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fixMobileOverflow, 150);
  });
})();
