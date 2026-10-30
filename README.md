# portfolio-foto

Bozza del sito portfolio di **Alessia Germinario**, fotografa in Puglia.
Sito statico con Vite, Three.js e GSAP; le foto vengono dai suoi due profili Behance
([alessiagermina](https://www.behance.net/alessiagermina), [alessiagermina2](https://www.behance.net/alessiagermina2)).

## Le tre bozze della home

Stesse sezioni (servizi per privati e aziende, lavori, chi sono, contatti), tre scene diverse per la hero:

| Pagina | Idea |
|---|---|
| `bozza-spirale.html` | **A · Spirale**: le foto ruotano su una galassia inclinata, con profondità di campo e comete di luce lungo i bracci. |
| `bozza-corridoio.html` | **B · Corridoio**: scrollando la camera attraversa le foto sospese in profondità. |
| `bozza-muro.html` | **C · Muro**: parete infinita e curva di foto che scorre da sola e si trascina. |
| `bozza-alessia.html` | Anteprima per Alessia: header, spirale, servizi e lavori; Chi sono e Contatti con fumetto "Coming soon". "Richiedi un preventivo" e il puntino dell'occhiello aprono l'easter egg. |

## Comandi

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # sito statico in dist/
npm run photos   # riscarica le foto da Behance (content/projects.json)
```

## Struttura

- `content/projects.json`: progetti, categorie e id delle foto su Behance e Instagram. È la fonte da modificare.
- `scripts/fetch-photos.mjs`: scarica le foto e crea le versioni WebP a 480, 800 e 1400 px in `public/photos/`, più il manifest `src/data/photos.json`.
- `scripts/instagram-import.js`: plugin di Vite (solo `npm run dev`) che riceve dal browser gli indirizzi delle foto di [@alexia.events](https://www.instagram.com/alexia.events/) e le salva in `.cache/raw-ig/`. Gli indirizzi di Instagram scadono: si importano subito dopo averli raccolti.
- Easter egg: il puntino tra nome e città nel footer apre un selfie di Alessia (`src/shared/easter.js`).
- `src/three/`: renderer condiviso (`stage.js`) e shader delle card (`cards.js`: sfocatura di profondità, aberrazione cromatica, angoli arrotondati, rigonfiamento sotto il puntatore).
- `src/drafts/`: una scena per bozza.
- `src/shared/`: dati, sezioni della pagina, titolo animato, pulsante pausa.

## Scelte

- Titolo, testi e pulsanti sono HTML: la scena WebGL è decorativa (`aria-hidden`), con collage statico se WebGL manca.
- Con `prefers-reduced-motion` la scena è ferma; c'è sempre il pulsante "Pausa animazione".
- Il rendering si ferma fuori schermo e con la tab nascosta; DPR massimo 2 (1,5 su mobile).
- Le foto stanno nel sito: il CDN di Behance non manda gli header CORS e non si possono usare come texture.
- Nella hero non ci sono le serie con minori (battesimo, comunione, Momenti).

## Da fare prima di andare online

- Liberatorie per le foto con persone riconoscibili, soprattutto minori.
- Testi veri (chi sono, servizi, prezzi "a partire da"), ritratto di Alessia, numero WhatsApp, email, Instagram.
- Collegare il form (es. Formspree) e scegliere il dominio.
- Pagine per servizio e per progetto con lightbox (PhotoSwipe), JSON-LD `LocalBusiness`, togliere `noindex`.

## Pubblicazione

GitHub Pages con GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main`.
