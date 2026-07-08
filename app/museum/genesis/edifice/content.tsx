import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisEdificeMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/edifice",
  title: "EDIFICE",
  description:
    'Edifice Ben Kovach Mint Date: 11/08/2021 Artist Narrative "Edifice" is a series of 976 massive, deteriorating structures built on strange terrain. It is an exploration of buildings being conceptualized, constructed, and eroded away under a wide variety of c...',
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Edifice</strong><br>Ben Kovach <br>Mint Date: 11/08/2021 </p>"
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
        "<p>“Edifice” is a series of 976 massive, deteriorating structures built on strange terrain. It is an exploration of buildings being conceptualized, constructed, and eroded away under a wide variety of conditions. Edifice's outputs run the gamut between minimal and maximal, with some showing few large, static blocks of color, and others many small, highly textured and warped shapes. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>Edifice is a wonderful conceptual collection of buildings. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/KOjmrfN1/s5_edifice_605.mp4",
        title: "EDIFICE artwork video 1",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>One of only two Edifices with cell size ‘Fine', #605 is a hugely distinctive Edifice. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 605</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Cell Size: Fine <br>Texture: Sqribble <br>Colors: Blood Orange </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>2/976 RG <br>2/976 ASR <br>2/976 AR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/QsZNvbZt/s5_edifice_432.mp4",
        title: "EDIFICE artwork video 2",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>One of four colossal traits, #432 is both rare and aesthetically emergent. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 432</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Cell Size: Colossal <br>Cell Aspect: Extra Wide <br>Colors: Salt </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>10/976 AR <br>16/976 ASR <br>16/976 RG </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/6TcLB4oA/s5_edifice_52.mp4",
        title: "EDIFICE artwork video 3",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Ska is one of the 6529 Museum's favorite colors in Edifice. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 52</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Cell Size: Huge <br>Colors: Ska <br>ill Style: Ns </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>101/976 AR <br>181/976 RG <br>185/976 ASR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/AQcQLnC6/s5_edifice_767.mp4",
        title: "EDIFICE artwork video 4",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>In fact, we like Ska so much, we have two.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 767</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Colors: Ska <br>Displacement: Wave <br>Interference: High </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>330/976 ASR <br>345/976 RG <br>406/976 AR </p>"
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
