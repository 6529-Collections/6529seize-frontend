import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisAlgorhythmsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/algorhythms",
  title: "ALGORHYTHMS",
  description:
    "Algorhythms Han x Nicolas Daniel Mint Date: 05/14/2022 Artist Narrative AlgoRhythms is a collection of generative audio-visual data sculptures. Each unique hash drives the combination of colors, patterns and musical scales into a music box. 6529 Museum Note...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Algorhythms</strong><br>Han x Nicolas Daniel <br>Mint Date: 05/14/2022 </p>"
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
        "<p>AlgoRhythms is a collection of generative audio-visual data sculptures. Each unique hash drives the combination of colors, patterns and musical scales into a music box. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>6529 Museum Notes <br></b>AlgoRhythms are famous for how they combine visual dynamism with custom (generative) music. They are quite loved among the NFT generative art community. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/CWkbHbC5/s3_algorhythms_371.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Cheerful sounds heard thanks to Major Pentatonic scale pair &amp; bright moving pillars. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 371</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Music Scale: Major Pentatonic (omit 5) <br>Background: Killarney <br>Style: White Outline </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>98/1000 RG <br>98/1000 ASR <br>157/1000 AR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/3iDBDNsC/s3_algorhythms_326.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Colorful and dense melody achieved by the use of the Aeolian musical scale. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 326</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Octaves: 2-3 <br>Music Scale: Aeolian (Ancient Greek) <br>Background: Biscay </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>521/1000 RG <br>521/1000 ASR <br>621/1000 AR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/lB96WKuQ/s3_algorhythms_4.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The melody generated in this output is is relatively sparse as it uses the “Adagio” BPM. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 4</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Subdivisions: Diagonal <br>Octaves: 2-3 <br>Music scale: Aeolian </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>4/1000 RG <br>4/1000 ASR <br>18/1000 AR </p>"
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
