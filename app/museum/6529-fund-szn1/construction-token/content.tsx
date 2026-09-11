import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1ConstructionTokenMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/construction-token",
  title: "CONSTRUCTION TOKEN",
  description:
    "Construction Token Jeff Davis CONSTRUCTION TOKEN #102 CONSTRUCTION TOKEN #7 Description Jeff Davis uses randomized seeds that determine the composition of each piece of artwork. Features include number, orientation, and position of the rectangles, as well a...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Construction Token</strong><br>Jeff Davis </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Construction-Token-102.png",
        alt: "6529.io",
        width: 1200,
        height: 1200,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Construction-Token-102.png",
      },
    },
    {
      type: "heading",
      content: "CONSTRUCTION TOKEN #102",
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Construction-Token-7.png",
        alt: "6529.io",
        width: 1200,
        height: 1200,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Construction-Token-7.png",
      },
    },
    {
      type: "heading",
      content: "CONSTRUCTION TOKEN #7",
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
        "<p>Jeff Davis uses randomized seeds that determine the composition of each piece of artwork. Features include number, orientation, and position of the rectangles, as well as the varying colors, whether monochromatic or on light or dark. Construction Token 102 is of the dark variant, with black background and electric blue rectangles that criss-cross up and down, sideways, to create a kind of labyrinth pattern. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
