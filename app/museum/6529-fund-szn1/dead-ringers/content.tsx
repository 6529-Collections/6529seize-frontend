import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1DeadRingersMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/dead-ringers",
  title: "DEAD RINGERS",
  description:
    "Dead Ringers Dmitri Cherniak DEAD RINGERS Description A whopping 23,469 wallets minted Cherniak’s Dead Ringers edition, a compilation of 30 days’ worth of algorithmically produced ringers. Each one is uniquely shaped, some like amoebas, skateboard ramps, sp...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Dead Ringers</strong><br>Dmitri Cherniak </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Dead-Ringers.png",
        alt: "6529.io",
        width: 3600,
        height: 5400,
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>DEAD RINGERS</p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Description <br></strong></p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>A whopping 23,469 wallets minted Cherniak's Dead Ringers edition, a compilation of 30 days' worth of algorithmically produced ringers. Each one is uniquely shaped, some like amoebas, skateboard ramps, spheres in galaxies, fingers dancing on a tabletop, an upside down octopus. So unique are the shapes that the mind can feast on the infinite variations and get lost in the labyrinth of pegs wrapped by maniacally moving string. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
