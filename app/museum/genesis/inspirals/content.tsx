import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisInspiralsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/inspirals",
  title: "INSPIRALS",
  description:
    "Inspirals Radix Mint Date: 03/20/2021 Artist Narrative Escher-style tiling of a plane, gone wrong. Each image spins hash-driven colors, shapes, and symmetries into infinity. Fly through the spiral as it morphs between beauty and madness. 6529 Museum Notes I...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Inspirals</strong><br>Radix <br>Mint Date: 03/20/2021 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Artist Narrative <br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Escher-style tiling of a plane, gone wrong. Each image spins hash-driven colors, shapes, and symmetries into infinity. Fly through the spiral as it morphs between beauty and madness. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>Inspirals are a dynamic collection with a kaleidoscope feel. The 6529 collection has two rare Inspirals. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/J1yR1CNE/s2_inspirals_447b.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A minimalistic output featuring a rare ‘black/white' color palette. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 447</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Outline: White <br>Palette: Black and White <br>Base Color: Black </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>22/1000 RG <br>22/1000 ASR <br>64/1000 AR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/MjwVQvMm/s2_inspirals_777b.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The ‘Double' spiral trait, is the dominant collection trait, handled incorrectly in stat rarity. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 777</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Spiral: Double <br>Shape: 5<br>Base Color: Purple </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>27/1000 AR <br>352/1000 ASR <br>352/1000 RG </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/c3pkRUD0/s2_inspirals_60b.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A single blue and white spiral make up this simple yet mesmerizing output. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 60</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Shape: 28 <br>Base Color: Blue <br>Symmetry Type: 6 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>636/1000 AR <br>723/1000 RG <br>723/1000 ASR </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>AR: Artacle Rarity | ASR: Artacle Statistical Rarity | RG: Rarity Guide | RS: Rarity Studio </strong></p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
