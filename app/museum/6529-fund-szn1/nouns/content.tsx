import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1NounsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/nouns",
  title: "NOUNS",
  description:
    "Nouns NounsDAO NOUN #118 Description One noun, every day, forever. The mantra of this colorful, playful, and charming collection is the epitome of generative art that promises to persist through eternity and pave a path for digital art’s permanence. With th...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Nouns</strong><br>NounsDAO </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Noun-118.png",
        alt: "6529.io",
        width: 320,
        height: 320,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Noun-118.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>NOUN #118</p>"),
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
        "<p>One noun, every day, forever. The mantra of this colorful, playful, and charming collection is the epitome of generative art that promises to persist through eternity and pave a path for digital art's permanence. With the iconic square glasses on every noun, the Noun collection feeds the treasury which serves to bolster and nourish the very community from which it sprang. Noun 118 wears the famous blue glasses, gold and white sweater, and has a helicopter shaped head of cherry and cream, blue windows, and black tail spinning high above. These cheery images seek to delight, to inspire a burst of joy, to extend the lifespan of this joy into eternity. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Bright in color, ranging in shapes from cows, strawberries, eggs, planets, wizard's hats, and king's crowns, Nouns take on a life and character all their own, providing an eclectic batch of pieces that promise to persevere. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
