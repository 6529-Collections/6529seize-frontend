import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisSquigglyWtfMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/squiggly-wtf",
  title: "SQUIGGLY.WTF",
  description:
    "Squiggly Nate Alex Mint Date: 10/02/2020 Artist Narrative Randomly generated and fully on-chain squiggly lines, the first project in the Atlantes series. Only 100 pieces were created during the minting process. The on-chain generator has now been shut off f...",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "heading",
      content: "Squiggly Nate Alex Mint Date: 10/02/2020",
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
        "<p>Randomly generated and fully on-chain squiggly lines, the first project in the Atlantes series. Only 100 pieces were created during the minting process. The on-chain generator has now been shut off forever so they are only available in the secondary market. Project was launched in October 2020. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Curve type refers to the type of bezier curve used in the on chain algorithm. All curve types had an equal probability of being created. Any auctioneer who called the end auction function for a given auction was credited as the creator of that Squiggly as they generated the seed to create the art for the auction winner and new owner. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><b>6529 Museum Notes <br></b>Squigglys were created by NateAlex in 2020 as another pioneering experiment in smart contract based art. 100 fully on chain Squiggly lines generated with unique creation mechanics where the actual artwork minter is the bidder who begins the auction, and proceeds raised throughout the auction were payable to the participants. </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/SQUIGGLY-300x300.png",
        alt: "6529.io",
        width: 300,
        height: 300,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/SQUIGGLY-300x300.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>#20 is a classic Squiggle.wtf and a good representation of the collection overall. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>Token: 20</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Key Traits: <br></strong>Curve Type: Q Curve (25) <br>Class Type: Standard (95) </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Rarity: <br></strong>1/100 </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
