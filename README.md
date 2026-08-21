# Shoptet úpravy – CLSmoto (clsmoto.cz)

Custom CSS + JS pro Shoptet e-shop **CLSmoto**, hostované na GitHubu a načítané
přes **GitHub Pages** (stejně jako protvoreni / callusan / deisirup / svetzarovek,
ne jsDelivr). Důvod: limit 8192 znaků v Shoptet `<head>` a možnost verzovat
úpravy v gitu místo lepení do adminu.

- Motiv: **paxio-merkur** (stejný jako Svět žárovek), v `<head>` navíc
  `dark-merkur.css` z paxio.
- Lokální složka: `/Users/janrohrich/Documents/Shoptet_shopy_clsmoto`
- Repo: https://github.com/czdsgnr/shoptet-clsmoto
- CDN: `https://czdsgnr.github.io/shoptet-clsmoto/shoptet.css` (+ `.js`)

## Soubory

| Soubor | Co obsahuje |
|--------|-------------|
| `shoptet.css` | všechny styly (moduly 0–12, viz hlavička souboru) |
| `shoptet.js` | modul A) karta majitele na HP, B) anti-overflow pojistka na mobilu |
| `puvodni-kod/` | archiv toho, co bylo v adminu v hlavičce a patičce k 30. 7. 2026 |

## Moduly v `shoptet.css`

0. Overflow / anti-skákání do stran (z patičky) + miniatury a slidery
1. Logo v hlavičce (`max-height: 46px`)
2. Otevírací doba v horní liště (`Po–Pá 8:00–16:30`)
3. Menu „Akce" červeně (+ diamant)
4. Akční ceny a badge červeně (`#e30613`) – výpis i detail
5. Badge do pravého horního rohu fotky na detailu
6. Pořadí bannerů v patičce
7. Obsahové stránky / blog – typografie 18px
8. Tabulka velikostí `.size-table`
9. Cena na landing page `.id-1`
10. Carousel ovládání
11. Karta majitele „Osobně ručím za Vaši spokojenost"
12. Tabulky v popisu produktu na mobilu (technické údaje) – **fix pro klienta**

## Vložení do Shoptetu

V adminu **Vzhled a obsah → Editor → HTML kódy v hlavičce** zůstane jen tohle
(zbytek stylů a skriptů nahrazují naše dva soubory):

```html
<!-- 1) Tmavý header (paxio dark-merkur) -->
<link type="text/css" id="dark-mode" rel="stylesheet preload" media="all"
      href="https://cdn.myshoptet.com/usr/paxio.myshoptet.com/user/documents/blank/dark-merkur.css" />

<!-- 2) Naše úpravy (statická verze – po každém deployi bumpni ?v=N) -->
<link rel="stylesheet" href="https://czdsgnr.github.io/shoptet-clsmoto/shoptet.css?v=2" />
<script defer src="https://czdsgnr.github.io/shoptet-clsmoto/shoptet.js?v=2"></script>

<!-- 3) Microsoft Clarity -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "v4ahcgh1hx");
</script>
```

**HTML kódy v patičce** se pak dají vyprázdnit úplně – styly i skript z patičky
jsou přenesené do `shoptet.css` (modul 0) a `shoptet.js` (modul B).

### Dev varianta (během ladění)

Místo statických `?v=N` jde použít loader s časovým razítkem, který obchází cache:

```html
<script>
(function () {
  var base = 'https://czdsgnr.github.io/shoptet-clsmoto/';
  var t = '?t=' + Date.now();
  var l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = base + 'shoptet.css' + t;
  document.head.appendChild(l);
  var s = document.createElement('script');
  s.src = base + 'shoptet.js' + t; s.defer = true;
  document.head.appendChild(s);
})();
</script>
```

Pozor: dev loader načítá CSS asynchronně → stránka chvíli problikne v původním
vzhledu (FOUC). Až bude hotovo, přepnout zpět na statický `<link>` + `?v=N`.

## Deploy

1. edit v této složce
2. `git add -A && git commit -m "…" && git push`
3. GitHub Pages build ~1–2 min
4. v Shoptetu **bumpnout `?v=N`** (jinak prohlížeč drží starou kopii)

Test čerstvosti bez cache:

```bash
curl -s "https://czdsgnr.github.io/shoptet-clsmoto/shoptet.css?x=$(date +%s)" | head -5
```

## Co je při přenosu opravené / k ověření

- **`.size-table`** – v původním kódu chyběl středník za `width: 100%`, takže
  celé pravidlo (včetně `min-width: 990px`) prohlížeč zahazoval. Opraveno →
  tabulka teď reálně dostane `min-width`, na mobilu ověřit vodorovný scroll.
- **Logo** – v hlavičce byly dvě protichůdné hodnoty (`60px` a `46px !important`).
  Platila poslední, tzn. 46px; drží se to teď na jednom místě.
- **Clarity běží 2×** – v hlavičce projekt `v4ahcgh1hx`, v patičce `wltgbfh9i2`.
  Dvojí měření stejného provozu; nechat jen jeden (v README výše je ponechaný
  ten z hlavičky).
- **Karta majitele se na webu nikdy nezobrazovala** (zjištěno 30. 7. 2026):
  původní skript hledal jeden kontejner s texty „Doporučené" + „Akční zboží" +
  „Novinky" a délkou < 300 znaků, ale motiv každou skupinu renderuje zvlášť
  (`div.homepage-group-title` jako přímé děti `main.content`) → nenašel nic a
  karta zůstala viset na začátku `<body>` s `display:none`. Náš `shoptet.js`
  se kotví na první `.homepage-group-title`; ověřeno naživo.
- **`line-height` v `rem`** (obsahové stránky, `.size-table`) – závisí na
  kořenovém `font-size` motivu. Kdyby se řádkování rozjelo, přepsat na
  bezrozměrné číslo.
- **`overflow-x: hidden` na `body`** – v některých motivech udělá z `body`
  scroll kontejner a rozbije sticky header / lazy-load. Kdyby k tomu došlo,
  nechat jen na `html`.
