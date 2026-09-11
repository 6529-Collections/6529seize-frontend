import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1RingersMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/ringers",
  title: "RINGERS",
  description:
    "Ringers Dmitri Cherniak RINGERS #376 RINGERS #210 Description A simple design provides a playful pop of color in Dmitri Cherniak’s Ringers collection. A Canadian born artist and coder, Cherniak explores the infinite ways in which a string can wrap around an...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Ringers</strong><br>Dmitri Cherniak </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/376.png",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/376.png",
      },
    },
    {
      type: "heading",
      content: "RINGERS #376",
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/210.png",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/210.png",
      },
    },
    {
      type: "heading",
      content: "RINGERS #210",
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
        "<p>A simple design provides a playful pop of color in Dmitri Cherniak's Ringers collection. A Canadian born artist and coder, Cherniak explores the infinite ways in which a string can wrap around an assortment of pegs. Employing algorithms to automate this distinct wrapping of string around pegs, the results are surprising, delightful, and evocative. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Ringers 376 contains nine pegs and the string wraps around them in the shape of a horseshoe, or a claw, or a modern day Pacman, or even like the hungry jaws of the Cookie Monster seeking more cookies. The vivid blue surrounded by black and white is so simple that it fascinates the eye and tricks the brain into seeing a number of patterns and shapes. A bright sunny peg of yellow adds a spot of color. Ringers 210 is intense with its red and black contrast, small white pegs, wrapped with thick black string almost resembling an X. Again, a spot of yellow draws the eye to it and creates a momentary burst of levity in an otherwise intense color scheme. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Cherniak seeks to show how automation can render art that evokes emotions in the same way as traditionally rendered images. He states, “a bug in generative art can create unexpected levels of beauty.” He implies that automation errors, like human errors, are artistic and captivating. The culmination of his algorithmic automations' ability to evoke emotions in us and rouse our minds with curiosity and wonder only brings us that much closer to living harmoniously with a digital and automated universe. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
