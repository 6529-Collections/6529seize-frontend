import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisSpectronMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/spectron",
  title: "SPECTRON",
  description:
    "Spectron Simon De Mai Mint Date: 02/13/2021 Artist Narrative This edition of video artworks is the result of my research in video art from the 60s and 70s, especially early analog video synthesizers. These were heavy hardware machines capable of generating...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Spectron</strong><br>Simon De Mai <br>Mint Date: 02/13/2021 </p>"
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
        "<p>This edition of video artworks is the result of my research in video art from the 60s and 70s, especially early analog video synthesizers. These were heavy hardware machines capable of generating shapes and patterns from the ground up, with no external visual input. How could these machines generate such complexity by just manipulating electronic voltage? I decided to investigate this process. Although with modern technologies, Spectron shares the procedural logic with its analog ancestors. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>6529 Museum Notes <br></b>Spectrons have an interesting 1980s aesthetic, with slowly moving motion. A subtle collection. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/0NoEIXeX/s2_spectrons_123.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The #1 rarity in the collection. A Coral-Teal dominant palette. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 123</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Palette: Coral-Teal <br>Bitwise operators: AND <br>Frequency modulation: Low </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>1/400 AR <br>1/400 ASR <br>8/400 RG </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/Oc0lbEae/s2_spectrons_84.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Another low frequency modulation specimen.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 84</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Frequency modulation: Low <br>Palette: Pink–Mint <br>Bitwise operators: Mixed </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>132/400 RG <br>132/400 AR <br>132/400 ASR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/eSsCNZK0/s2_spectrons_340.mp4",
        title: "Sorry, your browser doesn't support embedded videos.",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Overlapping lines attributed to the ‘OR' Bitwise operators. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 340</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Palette: Purple-Yellow <br>Bitwise operators: OR <br>Orientation: Horizontal </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>172/400 ASR <br>172/400 AR <br>173/400 RG </p>"
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
