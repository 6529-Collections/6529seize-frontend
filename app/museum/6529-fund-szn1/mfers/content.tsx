import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1MfersMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/mfers",
  title: "mfers",
  description:
    "mfers Sartoshi MFERS #904 Description “We are all mfers. There is no king, ruler, or defined roadmap.” Sartoshi envisions a collection to represent every person maneuvering a new digital world of art. Inspired by his love of cryptopunks, his art is drawn in...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>mfers</strong><br>Sartoshi </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/mfer-904.png",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/mfer-904.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>MFERS #904</p>"),
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
        "<p>“We are all mfers. There is no king, ruler, or defined roadmap.” Sartoshi envisions a collection to represent every person maneuvering a new digital world of art. Inspired by his love of cryptopunks, his art is drawn in a cartoon style with stick figures that boast large round heads. Often slouched back in a chair, stick hands extended to the keyboard, eyes glittering, sly smile punctuated with a cigarette and accentuated with rising smoke, these figures are artistic representations of Sartoshi's self portrait, capturing the essence of him sitting back and tweeting to the world that he will do as he pleases. The carefree spirit of mfers is reflected in the color scheme. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>mfer 904 is a bright blue alien, colored in with crayonesque squiggles of varying shades of blue. Wearing headphones and appearing dazed with sparkly alien eyes and a crudely drawn mouth, Sartoshi's pieces are reminiscent of coloring book cartoon characters set against stars sloppily sprinkled on a gray background with a little scribbled earth floating overhead. But upon closer inspection, there are layers to each element, lines that move to create shape and shadow in the round head, depth in the headphones, and a sense of chaos among the stars. Opacities of line strength ebb and flow so that the viewer can witness where the artist impressed force, thereby creating a more personal and human touch than a computer animated rendering might achieve. The world and all its cares are small and distant to this large-headed carefree smoking character. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
