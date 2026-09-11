import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisWillowShieldMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/willow-shield",
  title: "WILLOW SHIELD",
  description:
    "Willow Shield ixShells Mint Date: 08/02/2021 Artist Narrative Frameworks that seek to find novelty in movement variability, inside a spiral staircase decorated with blue. 6529 Museum Notes ixShells (Itzel Yard) is a well-known Afro-Caribbean generative arti...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Willow Shield</strong><br>ixShells <br>Mint Date: 08/02/2021 </p>"
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
        "<p>Frameworks that seek to find novelty in movement variability, inside a spiral staircase decorated with blue. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>6529 Museum Notes</strong><br>ixShells (Itzel Yard) is a well-known Afro-Caribbean generative artist who holds the highest NFT sale for a female NFT artist. Willow Shield is a 1 of 1 generative piece. It is a generative meditation that we can watch all day long. One day, we would love to see Willow Shield on the side of a building, both in digital and physical worlds. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Willow-Shield-300x245.png",
        alt: "6529.io",
        width: 300,
        height: 245,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Willow-Shield-300x245.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 26775</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>1/1 </p>"
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
