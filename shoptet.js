/* =========================================================
   Shoptet úpravy – CLSmoto (clsmoto.cz)
   Hostováno na GitHub Pages, viz README.

   Moduly:
     A) Karta majitele „Osobně ručím za Vaši spokojenost"
        (staví HTML a vkládá ho na HP nad blok Doporučené)
     B) Anti-overflow pojistka na mobilu (přeneseno z patičky)
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


  /* === Start ========================================================== */

  function init() {
    initOwnerCard();
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
