import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisFrammentiMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/frammenti",
  title: "FRAMMENTI",
  description:
    "Frammenti Stefano Contiero Mint Date: 05/21/2021 Artist Narrative Memories define us. Made of countless fragments, they are an ever-changing snapshot of our past. Frammenti is a digital explosion of life, inspired by our most personal treasures. 6529 Museum...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Frammenti</strong><br>Stefano Contiero <br>Mint Date: 05/21/2021 </p>"
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
        "<p>Memories define us. Made of countless fragments, they are an ever-changing snapshot of our past. Frammenti is a digital explosion of life, inspired by our most personal treasures. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>Frammenti is an insider loved collection, though less well understood in general. Most do not realize the collection is dynamic. </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/NoYTiqrY/s3_frammenti_361.mp4",
        title: "FRAMMENTI artwork video 1",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The rare duo type, combined with no fill gives 361 a minimal elegant feel. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 361</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Color: After <br>Type: Duo <br>Shapes: 2 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>38/555 RG <br>38/555 ASR <br>106/555 AR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/EZ76cImF/s3_frammenti_315.mp4",
        title: "FRAMMENTI artwork video 2",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>One of 28 macros that are highly valued by collectors. Rarities tend to underweight macros. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 315</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Type: Macro <br>Shapes: 1<br>Entropy: Maximum </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity:</strong><br>108/555 AR <br>114/555 RG <br>114/555 ASR </p>"
      ),
    },
    {
      type: "video",
      video: {
        src: "https://videos.files.wordpress.com/wOFpQRgU/s3_frammenti_217.mp4",
        title: "FRAMMENTI artwork video 3",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A classic Frammenti with 25 shapes.</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 217</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Type: Army <br>Shapes: 25 <br>Stability: Maximum </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>199/555 RG <br>199/555 ASR <br>221/555 AR </p>"
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
