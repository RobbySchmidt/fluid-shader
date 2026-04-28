# Wildgarten — Website-Briefing für Claude Code

Eine redaktionelle, magazinhafte Website rund um Garten, Natur und Lebensräume für Tiere. Ruhig, erzählerisch, mit warmen Erdtönen und SVG-Illustrationen statt Fotos.

---

## 1. Projekt-Übersicht

**Name:** Wildgarten
**Charakter:** Garten-Magazin, ruhig, geborgen, naturnah
**Zielgruppe:** Menschen, die ihren Garten mit Wildtieren teilen wollen — Wildbienen, Igel, Vögel, Schmetterlinge
**Stilrichtung:** "Waldlichtung" — erdig, warm, redaktionell, Serifenschrift für Headlines
**Medien:** Ausschließlich SVG-Illustrationen, keine Fotos. Alle Illustrationen werden direkt im Code generiert (siehe Abschnitt 6).

---

## 2. Setup-Hinweise

Die Umgebung ist bereits eingerichtet:
- **Nuxt 4** mit Vue 3
- **Tailwind CSS v4**
- **shadcn-vue** (bereits initialisiert)

**Zu beachten:**
- Komponenten als **Vue Single File Components** (`.vue`) mit `<script setup lang="ts">`
- shadcn-vue Komponenten **aktiv nutzen** für Button, Card, Input — nicht handbauen, was bereits gut existiert. Bei Bedarf neue shadcn-vue Komponenten installieren via `npx shadcn-vue@latest add <name>`.
- Schriften via `@nuxt/fonts` oder direktem Google-Fonts-Link einbinden: **Fraunces** (Display) + **Inter Tight** (Body)
- Illustrationen als eigene `.vue`-Komponenten unter `app/components/illustrations/`

---

## 3. Farbpalette "Waldlichtung"

Bitte folgende Farben in der Tailwind-CSS-Datei (z.B. `app/assets/css/tailwind.css` oder `assets/css/main.css`) als CSS-Variablen anlegen. Tailwind v4 nutzt das `@theme`-Block-Format — die Variablen sind danach automatisch als Tailwind-Utilities verfügbar (`bg-tannendunkel`, `text-eichenrinde`, etc.).

**Wichtig — Kompatibilität mit shadcn-vue:** shadcn-vue nutzt eigene CSS-Variablen (`--background`, `--foreground`, `--primary` etc.). Diese **bleiben unverändert** und werden zusätzlich auf unsere Waldlichtung-Werte gemappt, damit shadcn-Komponenten optisch zum Magazin-Stil passen.

```css
/* app/assets/css/tailwind.css */
@import "tailwindcss";

@theme {
  /* Primärfarben — Waldlichtung */
  --color-tannendunkel: #2D3A2A;   /* Dunkelster Grünton, für Headlines & primäre Akzente */
  --color-mooshell: #6B7F5A;       /* Mittlerer Grünton, für Sekundärflächen */
  --color-eichenrinde: #8B6F47;    /* Warmes Braun, für Subheadlines & Labels */
  --color-honigholz: #D4A574;      /* Helles, warmes Holz, für Illustrationen & Akzente */
  --color-pergament: #F2EDE0;      /* Heller Hintergrund, Cremeton */
  --color-pergament-hell: #FAF7EE; /* Noch hellerer Hintergrund für Karten */

  /* Akzent (sparsam einsetzen) */
  --color-mohnrot: #E07856;        /* Nur für CTAs & seltene Akzente */
  --color-pollen: #F4E9C8;         /* Sanftes Gelb für Highlights */

  /* Schriften */
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Inter Tight", system-ui, sans-serif;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}

/* shadcn-vue Variablen auf Waldlichtung mappen */
@layer base {
  :root {
    --background: 41 36% 91%;        /* pergament */
    --foreground: 110 14% 19%;        /* tannendunkel */
    --card: 41 60% 96%;               /* pergament-hell */
    --card-foreground: 110 14% 19%;
    --popover: 41 60% 96%;
    --popover-foreground: 110 14% 19%;
    --primary: 110 14% 19%;           /* tannendunkel */
    --primary-foreground: 41 36% 91%; /* pergament */
    --secondary: 91 17% 43%;          /* mooshell */
    --secondary-foreground: 41 36% 91%;
    --muted: 41 36% 91%;
    --muted-foreground: 30 33% 41%;   /* eichenrinde */
    --accent: 14 67% 61%;             /* mohnrot */
    --accent-foreground: 41 36% 91%;
    --destructive: 14 67% 61%;
    --destructive-foreground: 41 36% 91%;
    --border: 110 14% 19% / 0.1;
    --input: 110 14% 19% / 0.15;
    --ring: 14 67% 61%;               /* mohnrot für Focus-Ringe */
    --radius: 0.625rem;
  }
}

/* Globale Defaults */
body {
  background-color: var(--color-pergament);
  color: var(--color-tannendunkel);
  font-family: var(--font-body);
  font-feature-settings: "ss01", "ss02";
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.01em;
}

/* Kleines Eyebrow-Label im Magazin-Stil */
.eyebrow {
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--color-eichenrinde);
}
```

**Verwendungs-Hierarchie:**
- `pergament` ist die Standard-Hintergrundfarbe der Seite
- `pergament-hell` für hervorgehobene Karten/Container
- `tannendunkel` für Headlines, primäre Texte, primäre Buttons
- `eichenrinde` für Body-Sekundärtext und Eyebrow-Labels
- `mooshell` für Trennelemente, sekundäre Flächen
- `honigholz` als Hintergrund für Illustrationen
- `mohnrot` **nur sparsam** — primärer CTA, Hover-Akzent, ein Punkt pro Bildschirm
- `pollen` für sanfte Highlight-Flächen

---

## 4. Seitenstruktur

Eine Single-Page-Site (`app/pages/index.vue`) mit folgenden Sektionen (von oben nach unten):

1. **Header / Navigation** — schlank, transparent über Hero
2. **Hero** — große Serif-Headline, Eyebrow-Label, kurzer Untertitel, CTA, große SVG-Illustration rechts
3. **Drei Themen-Karten** — "Igel", "Wildbienen", "Vögel" mit Mini-Illustrationen
4. **Artenporträts** — Liste/Grid von 8 Arten, jeweils mit eigener SVG-Illustration, Steckbrief, lateinischem Namen
5. **Zitat / Editorial-Block** — großes Serif-Zitat in Pergament-Block
6. **Tagebuch-Vorschau** — drei aktuelle Einträge im Magazin-Stil
7. **Newsletter / Footer** — Eintragsfeld, sparsam gestaltet

---

## 5. Header & Navigation

```
┌──────────────────────────────────────────────────┐
│ ◯ Wildgarten      Lebensräume  Pflanzen  Tagebuch │
└──────────────────────────────────────────────────┘
```

- Position: `sticky top-0`, halbtransparenter `bg-pergament/80`-Hintergrund mit `backdrop-blur-sm`
- Links: kleines Logo-Icon (Kreis mit Punkt — `tannendunkel` Kreis, `honigholz` Punkt, 22px), daneben Wortmarke in `font-display`, 16px, weight 500
- Rechts: Nav-Links in 13px, `text-eichenrinde`, hover → `text-tannendunkel`
- Höhe: 64px, Padding: `px-8`

---

## 6. Hero-Sektion

**Layout:** zweispaltig auf Desktop (1.3fr / 1fr), gestapelt auf Mobile.

**Linke Spalte:**
- Eyebrow-Label: "AUSGABE Nº 04 — FRÜHLING"
- H1: "Ein Garten, der atmet, summt und lebt." — Fraunces, 56–72px Desktop, line-height 1.1, weight 500, mit gezielten `<br>` für rhythmische Zeilen
- Lead: 15–16px, Inter Tight, `text-eichenrinde`, max-width ~440px: "Geschichten, Anleitungen und Pflanzporträts für alle, die ihren Garten mit Wildbienen, Igeln und Vögeln teilen wollen."
- CTA: shadcn `<Button>` in `default`-Variante mit angepasstem Styling — Pillen-Form via `rounded-full`, Text "Tagebuch lesen →"

**Rechte Spalte: Hero-Illustration**

Eine quadratische SVG (viewBox 0 0 480 480), die folgendes zeigt:
- Hintergrundkreis oder abgerundetes Rechteck in `honigholz` (#D4A574) füllt fast die ganze Fläche
- Sonne oben rechts: Kreis `pollen` (#F4E9C8), Radius ~40px
- Hügelschicht im unteren Drittel: Ellipse in `eichenrinde` (#8B6F47)
- Mehrere stilisierte Bäume auf dem Hügel:
  - Stamm: Rechteck in `#5C4A30`
  - Krone: 3–4 überlagerte Kreise in `tannendunkel` (#2D3A2A) — wie eine Wolke geformt
  - Mindestens ein größerer Baum mittig (Höhe ~40% der Illustration), zwei kleinere
- Wildblumen im Vordergrund: 5–7 kleine Punkte in `mohnrot` und `pollen`, verteilt am unteren Rand
- Grasbüschel: kleine `<path>`-Dreiecke in `mooshell` und `tannendunkel` zwischen den Bäumen
- Optional: ein winziger Vogel als Silhouette im Himmel (kleiner schwarzer Bogen)

**Wichtig:** Flächige Formen, keine Verläufe, keine Schatten — Stil wie ein Holzschnitt oder eine Risographie. Die Illustration soll wie aus einem Kinderbuch der 70er wirken: warm, reduziert, gemütlich.

---

## 7. Themen-Karten (drei Säulen)

Direkt unter dem Hero, dreispaltiges Grid mit `gap-4`. Nutze die shadcn `<Card>`-Komponente als Basis (`<Card>`, `<CardContent>`).

Jede Karte:
- Hintergrund: `bg-pergament-hell`, leichter Border `border-tannendunkel/10`, padding `p-5`
- Oben: kleine SVG-Illustration als Banner (Höhe 96px, volle Breite, `rounded-sm`)
- Eyebrow: "IGEL" / "WILDBIENEN" / "VÖGEL"
- H3 in Fraunces, 16–18px, `text-tannendunkel`
- Lead: 12–13px, `text-eichenrinde`, 1–2 Zeilen

**Karte 1 — Igel** ("Eine Ecke für den Stachelritter")
- Banner-Hintergrund: `mooshell`
- Igel-Illustration: zwei überlappende `tannendunkel`-Kreise als Körper, kleines Auge in `pergament`, Stacheln als kleine Striche oben
- Rechts daneben: ein Laubhaufen aus 3–4 unterschiedlich großen Blattformen in `eichenrinde` und `honigholz`

**Karte 2 — Wildbienen** ("Nisthilfen, die wirklich helfen")
- Banner-Hintergrund: `honigholz`
- Bienen-Illustration: Ellipse als Körper in `tannendunkel`, zwei `mooshell`-Ellipsen als Flügel, kleine Antennen-Striche
- Links und rechts: 2–3 stilisierte Blüten in `mohnrot` und `pollen`

**Karte 3 — Vögel** ("Ganzjährig füttern oder nicht?")
- Banner-Hintergrund: `tannendunkel`
- Vogel-Illustration: Zaunkönig-Form in `pollen` (`<path>` mit ovalem Körper, kleinem Kopf, dreieckigem Schnabel in `mohnrot`)
- Verstreute kleine `pollen`-Punkte als Sterne/Krümel im Hintergrund

---

## 8. Artenporträts (Hauptsektion)

Überschrift: "Gäste im Wildgarten" (Fraunces, 36px) + Eyebrow "ARTENPORTRÄTS"

Grid: 4 Spalten Desktop, 2 Spalten Tablet, 1 Spalte Mobile, `gap-6`. Wieder shadcn `<Card>` als Basis.

Jedes Porträt:
```
┌─────────────────┐
│                 │
│  [Illustration] │  ← quadratisch, 200x200, abgerundet
│                 │
├─────────────────┤
│ VOGEL           │  ← Eyebrow
│ Rotkehlchen     │  ← Fraunces, 18px
│ Erithacus       │  ← Italic, eichenrinde, 12px
│ rubecula        │
│                 │
│ Steckbriefzeile │  ← 12px Body
│ Steckbriefzeile │
│ Steckbriefzeile │
└─────────────────┘
```

**Steckbrief-Zeilen:** Drei Key-Value-Paare, jeweils mit `text-eichenrinde`-Label links und `text-tannendunkel`-Wert rechts, getrennt durch dünne `border-mooshell/20`-Linie:
- Größe / Spannweite
- Lebensraum
- Aktiv

**Die Artenliste — bitte alle acht erstellen:**

| Art | Lateinisch | Kategorie | Größe | Lebensraum | Aktiv |
|---|---|---|---|---|---|
| Rotkehlchen | *Erithacus rubecula* | Vogel | 14 cm | Hecke, Unterholz | Ganzjährig |
| Igel | *Erinaceus europaeus* | Säugetier | 25 cm | Laubhaufen, Hecken | Dämmerung, Nacht |
| Gehörnte Mauerbiene | *Osmia cornuta* | Wildbiene | 12 mm | Totholz, Lehmwände | März–Mai |
| Tagpfauenauge | *Aglais io* | Schmetterling | 6 cm Spw. | Brennnessel, Sommerflieder | März–Oktober |
| Zaunkönig | *Troglodytes troglodytes* | Vogel | 9 cm | Dichtes Gebüsch | Ganzjährig |
| Erdkröte | *Bufo bufo* | Amphibie | 12 cm | Feuchte Ecken, Teich | Dämmerung |
| Hummel (Erdhummel) | *Bombus terrestris* | Wildbiene | 18 mm | Erdhöhlen, Wiesen | März–September |
| Eichhörnchen | *Sciurus vulgaris* | Säugetier | 25 cm | Hohe Bäume, Hecken | Tagsüber |

**Illustrationsanweisung pro Art** (jeweils SVG 200×200, abgerundete Ecken, farbiger Hintergrund):

1. **Rotkehlchen** — Hintergrund `mooshell`. Rundlicher Vogelkörper als Ellipse in `tannendunkel`, runde `mohnrot`-Brust (eigene Ellipse, überlappend), kleiner schwarzer Punkt als Auge mit `pergament`-Glanzpunkt, dreieckiger `eichenrinde`-Schnabel, dünne `eichenrinde`-Beine. Sitzt auf einem stilisierten Zweig.

2. **Igel** — Hintergrund `pergament-hell`. Halbkreis-Körper in `tannendunkel`, viele kleine Striche oben als Stacheln (Linien `#1A2419`), spitze kleine Schnauze in `eichenrinde`, schwarzes Knopfauge mit Glanz. Unten ein paar Blätter in `honigholz`.

3. **Gehörnte Mauerbiene** — Hintergrund `honigholz`. Gestreifter Körper aus drei Ellipsen abwechselnd `tannendunkel` und `eichenrinde`, zwei transparente `pergament-hell`-Flügel (opacity 0.6), zwei Antennen, sechs kleine Beinchen.

4. **Tagpfauenauge** — Hintergrund `tannendunkel`. Vier Flügel als Ellipsen in `mohnrot` mit `pollen`-"Augen"-Kreisen, Körper als dünne `pergament`-Ellipse mittig, zwei Antennen.

5. **Zaunkönig** — Hintergrund `eichenrinde`. Sehr kleiner, rundlicher Vogel mit aufgestelltem Schwanz (charakteristisch!), Körper `pergament` und `honigholz`, kleines Auge, dünner Schnabel.

6. **Erdkröte** — Hintergrund `mooshell`. Gedrungene Körperform in `eichenrinde` mit dunkleren `tannendunkel`-Flecken (kleine Kreise), zwei goldene `pollen`-Augen mit schwarzen Pupillen, sitzt auf einem Stein/Erde in `tannendunkel`.

7. **Erdhummel** — Hintergrund `pollen`. Pelzige, runde Form aus überlagerten `tannendunkel`- und `pollen`-Streifen, kleiner weißer Hinterleib-Tip, zwei `pergament-hell`-Flügel, dicke pelzige Anmutung durch leicht unregelmäßige Kanten.

8. **Eichhörnchen** — Hintergrund `honigholz`. Charakteristischer buschiger Schwanz (Bogenform) in `mohnrot`/rotbraun, Körper sitzend in gleicher Farbe, helle `pollen`-Brust, schwarzes Auge, kleine spitze Ohren mit Pinsel.

**Stil-Konstanten für ALLE Illustrationen:**
- Keine Verläufe, keine Schatten, keine Filter
- Klare flächige Formen
- 0.5–1px Outlines nur dort, wo nötig (z.B. Kontrast Körper zu Hintergrund)
- Wenige Farben pro Illustration (max. 4 aus der Palette)
- Ein leichter, freundlicher, fast kindlicher Ton — aber sorgfältig komponiert
- Tiere immer leicht stilisiert, niemals fotorealistisch
- Jede Illustration als eigene `.vue`-Komponente unter `app/components/illustrations/arten/`, z.B. `Rotkehlchen.vue`
- Innerhalb der `.vue`-Komponente das `<svg>` direkt im Template, ggf. `defineProps` für eine optionale `size`-Prop

**Beispiel-Skelett einer Illustrations-Komponente:**

```vue
<!-- app/components/illustrations/arten/Rotkehlchen.vue -->
<script setup lang="ts">
defineProps<{ size?: number }>();
</script>

<template>
  <svg
    :width="size ?? 200"
    :height="size ?? 200"
    viewBox="0 0 200 200"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Rotkehlchen</title>
    <desc>Stilisierte Illustration eines Rotkehlchens auf einem Zweig</desc>
    <rect width="200" height="200" rx="10" fill="#6B7F5A" />
    <!-- Vogelkörper, Brust, Auge, Schnabel, Beine, Zweig -->
  </svg>
</template>
```

---

## 9. Editorial-Zitat-Block

Zwischen Artenporträts und Tagebuch:

```
       ┌───────────────────────────────────┐
       │                                   │
       │   "Ein wilder Garten ist nicht    │
       │    unordentlich. Er ist voller    │
       │    Ordnung — nur nach den         │
       │    Regeln der Tiere."             │
       │                                   │
       │   — Anonym, gesammelt am Zaun     │
       │                                   │
       └───────────────────────────────────┘
```

- Hintergrund: voll-breite `bg-tannendunkel`-Sektion mit `py-24`
- Zitat zentriert, Fraunces, 32–40px, `text-pergament`, italic
- Quelle darunter im Eyebrow-Stil, `text-honigholz`

---

## 10. Tagebuch-Vorschau

Drei shadcn `<Card>`-Komponenten im 3er-Grid, Magazin-Layout:
- Datum oben (`text-eichenrinde`, klein, z.B. "24. APRIL")
- H4 in Fraunces, 18px
- Zwei Zeilen Vorschautext
- Kleines `→`-Icon unten rechts

**Beispieleinträge:**
1. "Die ersten Schmetterlinge" — über Tagpfauenaugen am Sommerflieder
2. "Was die Amsel verraten hat" — Beobachtungsnotizen aus dem Garten
3. "Mai-Aussaat: Wilde Möhre" — Anleitung mit Standortwahl

---

## 11. Footer

- Hintergrund `bg-tannendunkel`
- Drei Spalten: Logo + Slogan / Navigation / Newsletter-Eingabe
- Newsletter-Input: shadcn `<Input>`-Komponente in einem Container mit `bg-pergament`-Hintergrund, Pillen-Form (`rounded-full`), Inline-Submit-`<Button>` in `mohnrot`
- Copyright klein in `text-mooshell` unten

---

## 12. Mikro-Details und Polish

- **Cursor:** kein custom cursor, Standard.
- **Hover-States:** Karten heben sich leicht (`hover:-translate-y-0.5`, `transition`), Border wird etwas dunkler.
- **Scroll-Animation:** Einfaches Fade-up bei Sektion-Eintritt mit Intersection Observer (eigener Composable `useFadeIn` oder per VueUse `useIntersectionObserver`) — sehr dezent, 300ms, 8px Versatz. Falls VueUse noch nicht installiert ist: `npm i @vueuse/core`.
- **Bilder/SVGs:** alle inline als `.vue`-Komponenten, niemals als externe Datei.
- **Accessibility:** `<title>` und `<desc>` in jeder SVG (`role="img"`), korrekte Heading-Hierarchie, alle interaktiven Elemente per Tastatur erreichbar, Fokus-Ringe in `mohnrot` (über `--ring`).
- **Responsive:** Mobile-first arbeiten. Hero stapelt, Grid wird einspaltig, Schriftgrößen skalieren um ~25% nach unten.
- **Performance:** keine externen Bibliotheken außer dem bereits installierten Stack. SVGs sind klein.

---

## 13. Datei-Struktur (Vorschlag, Nuxt 4)

```
app/
  app.vue
  pages/
    index.vue                            ← Single Page, importiert alle Sections
  components/
    Header.vue
    Hero.vue
    ThemenKarten.vue
    Artenportraits.vue
    ArtenkarteCard.vue                   ← Wiederverwendbare Karte für eine Art
    ZitatBlock.vue
    TagebuchVorschau.vue
    SiteFooter.vue                       ← "Footer" als Komponentenname vermeiden
    illustrations/
      HeroIllustration.vue
      IgelMini.vue
      BieneMini.vue
      VogelMini.vue
      arten/
        Rotkehlchen.vue
        Igel.vue
        Mauerbiene.vue
        Tagpfauenauge.vue
        Zaunkoenig.vue
        Erdkroete.vue
        Hummel.vue
        Eichhoernchen.vue
  assets/
    css/
      tailwind.css                       ← Mit @theme-Block
  composables/
    useFadeIn.ts                         ← Optional, für Scroll-Animationen
shared/
  types/
    art.ts                               ← Art-Typ
data/
  arten.ts                               ← Array mit den 8 Arten + Steckbriefen
```

**Hinweis zur Nuxt-Auto-Import:** Komponenten in `app/components/` werden automatisch importiert. Verschachtelte Pfade werden präfixiert — `app/components/illustrations/arten/Rotkehlchen.vue` wird zu `<IllustrationsArtenRotkehlchen />`. Alternativ können die Illustrationen explizit importiert und per dynamischer Komponente per Slug geladen werden.

**`shared/types/art.ts`:**
```ts
import type { Component } from "vue";

export type Art = {
  slug: string;
  name: string;
  latein: string;
  kategorie: "Vogel" | "Säugetier" | "Wildbiene" | "Schmetterling" | "Amphibie";
  groesse: string;
  lebensraum: string;
  aktiv: string;
  illustration: Component;
};
```

**`data/arten.ts`** als zentrale Datenquelle:
```ts
import type { Art } from "~/shared/types/art";
import Rotkehlchen from "~/app/components/illustrations/arten/Rotkehlchen.vue";
// ... weitere Imports

export const arten: Art[] = [
  {
    slug: "rotkehlchen",
    name: "Rotkehlchen",
    latein: "Erithacus rubecula",
    kategorie: "Vogel",
    groesse: "14 cm",
    lebensraum: "Hecke, Unterholz",
    aktiv: "Ganzjährig",
    illustration: Rotkehlchen,
  },
  // ... 7 weitere Arten
];
```

`ArtenkarteCard.vue` rendert dann per `<component :is="art.illustration" />`.

---

## 14. shadcn-vue Komponenten — bitte installieren

Falls noch nicht vorhanden, bitte folgende shadcn-vue Komponenten installieren und nutzen:

```bash
npx shadcn-vue@latest add button
npx shadcn-vue@latest add card
npx shadcn-vue@latest add input
```

**Verwendung:**
- `<Button>` für Hero-CTA und Newsletter-Submit
- `<Card>`, `<CardHeader>`, `<CardContent>` für Themen-Karten, Artenporträts und Tagebuch-Karten
- `<Input>` für das Newsletter-Eingabefeld

Eigene Styling-Anpassungen über `class`-Prop und Tailwind-Utilities — keine Modifikationen an den shadcn-Quelldateien selbst, außer dem initialen Theme-Mapping in der CSS-Datei.

---

## 15. Akzeptanzkriterien

Wenn du fertig bist, sollte gelten:
- Die Seite läuft mit `npm run dev` ohne Konsolenfehler.
- Alle 8 Arten haben eine eigene, stilistisch konsistente SVG-Illustration als `.vue`-Komponente.
- Hero-Illustration ist groß, atmosphärisch, mit Bäumen und Wiese.
- Drei Themen-Karten haben jeweils eine Mini-Illustration.
- Farbpalette ist als CSS-Variablen in der Tailwind-CSS-Datei angelegt und durchgängig per Tailwind-Klasse genutzt — keine Hex-Codes verstreut im Code.
- shadcn-vue Komponenten (Button, Card, Input) werden tatsächlich verwendet, nicht nachgebaut.
- Schriftpaarung Fraunces / Inter Tight ist eingebunden.
- Mobile sieht ordentlich aus (kein Overflow, keine winzigen Schriften).
- Es gibt keinen generischen "AI-Look": keine lila Gradients, kein Glassmorphism, keine generischen Stockfoto-Platzhalter.

---

## 16. Was du NICHT tun sollst

- Keine Foto-Platzhalter wie `https://images.unsplash.com/...` oder Placeholder-Dienste — alles als generierte SVG.
- Keine Emoji als Ersatz für Illustrationen.
- Keine zusätzliche UI-Bibliothek neben shadcn-vue — keine PrimeVue, kein Vuetify.
- Keine Lila-/Purple-Akzente — die Palette ist warm-erdig.
- Keine `box-shadow`-Orgien, keine Glassmorphism-Effekte, keine animierten Gradients.
- Keine Lorem Ipsum — wenn etwas fehlt, sinnvollen deutschen Garten-Text erfinden, der zum Magazin-Ton passt.
- Die shadcn-Quellkomponenten unter `components/ui/` nicht verändern — Anpassungen nur via Theme-Variablen oder Wrapper-Komponenten.

---

Viel Freude beim Bauen. Wenn du an einer Stelle eine Designentscheidung treffen musst, die hier nicht abgedeckt ist: bleib bei der Devise *"ruhig, redaktionell, naturnah"* und du bist auf dem richtigen Pfad.
