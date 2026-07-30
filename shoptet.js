/* =========================================================
   Shoptet úpravy – CLSmoto (clsmoto.cz)
   Hostováno na GitHub Pages, viz README.

   Moduly:
     A) Karta majitele „Osobně ručím za Vaši spokojenost"
        (staví HTML a vkládá ho na HP nad taby Doporučené/Akce/Novinky)
     B) Anti-overflow pojistka na mobilu (přeneseno z patičky)
   ========================================================= */
(function () {
  'use strict';

  /* === A) Karta majitele ============================================== */

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

  /* Kartu buď najdeme v DOM (kdyby ještě zůstala v <head> z původního
     kódu – pak ji jen přesuneme, nevyrábíme duplikát), nebo ji postavíme. */
  function getOwnerCard() {
    var existing = document.getElementById('cls-owner-move');
    if (existing) return existing;

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
    return card;
  }

  function normalizedText(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /* Blok s taby na homepage poznáme podle textu – motiv pro něj nemá
     stabilní třídu. Krátký text (< 300 znaků) zajistí, že netrefíme
     rodičovský kontejner s celým obsahem stránky. */
  function findTabsBlock() {
    var nodes = document.querySelectorAll('div, section, ul, nav');
    for (var i = 0; i < nodes.length; i++) {
      var txt = normalizedText(nodes[i]);
      if (
        txt.indexOf('Doporučené') > -1 &&
        txt.indexOf('Akční zboží') > -1 &&
        txt.indexOf('Novinky') > -1 &&
        txt.length < 300
      ) {
        return nodes[i];
      }
    }
    return null;
  }

  function placeOwnerCard() {
    var card = getOwnerCard();
    if (card.dataset.done === '1') return true;

    var tabs = findTabsBlock();
    if (!tabs) return false;

    /* Vylezeme nahoru přes obaly, které mají jen jedno dítě – jinak
       bychom kartu vložili doprostřed vnořených wrapperů. */
    var target = tabs;
    while (
      target.parentElement &&
      target.parentElement !== document.body &&
      target.parentElement.children.length === 1
    ) {
      target = target.parentElement;
    }

    target.parentNode.insertBefore(card, target);
    card.style.display = 'flex';
    card.dataset.done = '1';
    return true;
  }

  function initOwnerCard() {
    if (placeOwnerCard()) return;

    /* Taby se dorenderují až po AJAXu → chvíli to zkoušíme dál (max 6 s). */
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
