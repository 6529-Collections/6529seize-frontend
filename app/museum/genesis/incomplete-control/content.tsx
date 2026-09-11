import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisIncompleteControlMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/incomplete-control",
  title: "INCOMPLETE CONTROL",
  description:
    "Incomplete Control Tyler Hobbs Mint Date: 12/09/2021 Artist Narrative Incomplete Control deals heavily with imperfection. I have always been interested in the presence of imperfection in the analog world, and the relative absence of it in the digital world....",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Incomplete Control</strong><br>Tyler Hobbs <br>Mint Date: 12/09/2021 </p>"
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
        "<p>Incomplete Control deals heavily with imperfection. I have always been interested in the presence of imperfection in the analog world, and the relative absence of it in the digital world. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>Incomplete Control is an extraordinary powerhouse of a collection from Tyler Hobbs, the creator of Fidenza. The goal of the collection is to show a more organic, analog output. The more you look at the details of Incomplete Controls, the more interesting they become. Incomplete Controls are a small collection (100 outputs) with no traits or rarity. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Incomplete-Control-19-240x300.png",
        alt: "6529.io",
        width: 240,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Incomplete-Control-19-240x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>For your own interpretation.</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 19</p>"),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Incomplete-Control-24-240x300.png",
        alt: "6529.io",
        width: 240,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Incomplete-Control-24-240x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>For your own interpretation.</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 24</p>"),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Incomplete-Control-74-240x300.png",
        alt: "6529.io",
        width: 240,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Incomplete-Control-74-240x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>For your own interpretation.</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 74</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>AR: Artacle Rarity | ASR: Artacle Statistical Rarity | RG: Rarity Guide | RS: Rarity Studio </strong></p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
