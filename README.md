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

## Comandi

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # sito statico in dist/
npm run photos   # riscarica le foto da Behance (content/projects.json)
```

## Struttura

- `content/projects.json`: progetti, categorie e id delle foto su Behance. È la fonte da modificare.
- `scripts/fetch-photos.mjs`: scarica le foto e crea le versioni WebP a 480, 800 e 1400 px in `public/photos/`, più il manifest `src/data/photos.json`.
- `src/three/`: renderer condiviso (`stage.js`) e shader delle card (`cards.js`: sfocatura di profondità, aberrazione cromatica, angoli arrotondati, rigonfiamento sotto il puntatore).
- `src/drafts/`: una scena per bozza.
- `src/shared/`: dati, sezioni della pagina, titolo animato, pulsante pausa.

## Scelte

- Titolo, testi e pulsanti sono HTML: la scena WebGL è decorativa (`aria-hidden`), con collage statico se WebGL manca.
- Con `prefers-reduced-motion` la scena è ferma; c'è sempre il pulsante "Pausa animazione".
- Il rendering si ferma fuori schermo e con la tab nascosta; DPR massimo 2 (1,5 su mobile).
- Le foto stanno nel sito: il CDN di Behance non manda gli header CORS e non si possono usare come texture.
- Nella hero non ci sono le foto di battesimo e comunione (minori).

## Da fare prima di andare online

- Liberatorie per le foto con persone riconoscibili, soprattutto minori.
- Testi veri (chi sono, servizi, prezzi "a partire da"), ritratto di Alessia, numero WhatsApp, email, Instagram.
- Collegare il form (es. Formspree) e scegliere il dominio.
- Pagine per servizio e per progetto con lightbox (PhotoSwipe), JSON-LD `LocalBusiness`, togliere `noindex`.

## Pubblicazione

GitHub Pages con GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main`.
