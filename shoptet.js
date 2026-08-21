/* =========================================================
   Shoptet úpravy – CLSmoto (clsmoto.cz)
   Hostováno na GitHub Pages, viz README.

   Moduly:
     A) Karta majitele „Osobně ručím za Vaši spokojenost"
        (staví HTML a vkládá ho na HP nad blok Doporučené)
     B) Anti-overflow pojistka na mobilu (přeneseno z patičky)
     C) Rozbalovací „Technické údaje" v pravém sloupci detailu
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


  /* === Start ========================================================== */

  function init() {
    initOwnerCard();
    initSpecsToggle();
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
