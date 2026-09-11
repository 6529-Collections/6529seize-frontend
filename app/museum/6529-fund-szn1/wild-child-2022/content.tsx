import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1WildChild2022MigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/wild-child-2022",
  title: "WILD CHILD 2022",
  description:
    "Wild Child 2022 Ali Sabet WILD CHILD 2022 Description Ali Sabet soaks up love, brightness, and optimism in each stroke and creates a bouquet of color in his vibrant paintings. Wild Child features the portrait of a female wearing a bold and expressive crown...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Wild Child 2022</strong><br>Ali Sabet </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Wild-Child-2022-1200x1754.jpg",
        alt: "6529.io",
        width: 1200,
        height: 1754,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Wild-Child-2022-1200x1754.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>WILD CHILD 2022 </p>"),
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
        "<p>Ali Sabet soaks up love, brightness, and optimism in each stroke and creates a bouquet of color in his vibrant paintings. Wild Child features the portrait of a female wearing a bold and expressive crown of flowers. The image is striking with its use of primary colors, red, blue, and yellow, outlined and detailed with bold black to produce the vibrancy and animation of comic book art. Even some of the dotted hashes to shade the petals are reminiscent of comic book shading, adding a note of playful optimism and hope that is present in superhero stories. The female gazes up through long lashes, her makeup is like that of a Venetian doll, blue eyeshadow, cherry red lip, and two cherry cheeks to match her dress. The varicolored flowers frame her face so that she is nearly consumed by their beauty and graceful lines. Sabet seeks to inspire an appreciation for life and beauty in his art, showing his subjects immersed in that beauty, and further creating a work of striking beauty in the hopes that it will do the same for anyone who sets eyes upon it. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
