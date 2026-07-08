import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1BalladOfGhostsMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/ballad-of-ghosts",
  title: "BALLAD OF GHOSTS",
  description:
    "Ballad of Ghosts Otherworld BALLAD OF GHOSTS Description Inspired by Dance to the Music of Time by Nicolas Poussin, OtherWorld_xx creates Ballad of Ghosts. This abstract rendering is predominantly cotton candy pink layered over bright blue. Through the clou...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Ballad of Ghosts</strong><br>Otherworld </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Ballad-of-Ghosts.jpg",
        alt: "6529.io",
        width: 600,
        height: 720,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Ballad-of-Ghosts.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>BALLAD OF GHOSTS </p>"),
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
        "<p>Inspired by Dance to the Music of Time by Nicolas Poussin, OtherWorld_xx creates Ballad of Ghosts. This abstract rendering is predominantly cotton candy pink layered over bright blue. Through the cloudy shadows, there is movement in the strokes to simulate dancing. In the piece that inspired it a group of gods hold hands and dance as Time plays on a lyre. In Ballad of Ghosts, no subjects can be seen clearly, instead one must imagine they are present in ghostly form, swept up by the clouds of time. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
