# portfolio-foto

Bozza del sito portfolio di **Alessia Germinario**, fotografa a Molfetta.
Sito statico fatto con Vite, Three.js e GSAP. Le foto vengono dai suoi profili
Behance ([alessiagermina](https://www.behance.net/alessiagermina), [alessiagermina2](https://www.behance.net/alessiagermina2))
e Instagram ([@alexia.events](https://www.instagram.com/alexia.events/)).

Il sito è la pagina `bozza-alessia.html`; `index.html` porta lì.

## Comandi

```bash
npm install
npm run dev      # http://localhost:5180/bozza-alessia.html
npm run build    # sito statico in dist/
npm run photos   # riscarica le foto da Behance (content/projects.json)
```

## Come è fatto

La pagina è HTML scritto a mano: header, hero, servizi, chi sono, contatti e footer.
Il JavaScript aggiunge solo la parte animata e la griglia dei lavori.

| File | Cosa fa |
|---|---|
| `bozza-alessia.html` | La pagina. |
| `src/style.css` | Tutti gli stili. |
| `src/main.js` | Avvio: collega le varie parti della pagina. |
| `src/data.js` | Dati dei progetti (da `src/data/photos.json`) e funzioni per leggerli. |
| `src/works.js` | Griglia dei lavori e filtri Tutti / Privati / Aziende. |
| `src/hero.js` | Titolo animato, pulsante pausa, etichetta del progetto sopra le foto. |
| `src/contact.js` | Form dei contatti. |
| `src/easter-egg.js` | Il selfie di Alessia con i cuori viola. |
| `src/scene/stage.js` | Canvas WebGL, camera e ciclo di disegno. |
| `src/scene/card.js` | Una foto della spirale e il suo shader (sfocatura, angoli arrotondati, cornice). |
| `src/scene/spiral.js` | La spirale: bracci con le comete, polvere, cerchi e card. |

Foto e dati:

- `content/projects.json`: progetti, categorie e id delle foto su Behance e Instagram. È il file da modificare.
- `scripts/fetch-photos.mjs`: scarica le foto e crea le versioni WebP da 480, 800 e 1400 px in `public/photos/`, più `src/data/photos.json`.
- `scripts/instagram-import.js`: plugin di Vite (solo con `npm run dev`) che riceve dal browser gli indirizzi delle foto Instagram e le salva in `.cache/raw-ig/`. Gli indirizzi di Instagram scadono: vanno importati subito.

## Easter egg

Il selfie di Alessia si apre dal puntino tra "Fotografa" e "Molfetta", da quello nel footer
("Mi hai trovata!") e dai pulsanti "Richiedi un preventivo" in alto ("Mi hai beccato").

## Scelte

- Titolo, testi e pulsanti sono HTML: la spirale è decorativa (`aria-hidden`). Senza WebGL al suo posto c'è un collage di foto ferme.
- Con "riduci movimento" attivo la spirale è ferma; c'è sempre il pulsante "Pausa animazione".
- La spirale non si disegna quando è fuori schermo o la scheda è nascosta.
- Le foto stanno nel sito: il CDN di Behance non permette di usarle come texture WebGL.
- Nella spirale non ci sono le serie con minori (battesimo, comunione, Momenti).

## Da fare prima di andare online

- Liberatorie per le foto con persone riconoscibili, soprattutto minori.
- Testi veri (chi sono, servizi, prezzi "a partire da"), ritratto di Alessia, numero WhatsApp, email.
- Collegare il form (es. Formspree) e scegliere il dominio.
- Pagine per servizio e per progetto, JSON-LD `LocalBusiness`, togliere `noindex`.

## Pubblicazione

GitHub Pages con GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main`.

## Crediti

Sfondo della sezione contatti: foto di [Ahmadreza Rezaie](https://unsplash.com/@ahmdrzarzai) su Unsplash ([licenza Unsplash](https://unsplash.com/license)).
