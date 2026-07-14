import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1ProofGrailsWallMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/proof-grails-wall",
  title: "PROOF GRAILS - WALL",
  description:
    "Proof Grails - Wall Tyler Hobbs PROOF GRAILS - WALL Description Tyler Hobbs’ Wall is part of the Grails by PROOF collection. Wall is a generative study of a photorealistic image, in this case of a wall from Austin, Texas, the artist’s hometown. Hobbs’ pursu...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Proof Grails – Wall</strong><br>Tyler Hobbs </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Wall-1200x800.jpg",
        alt: "6529.io",
        width: 1200,
        height: 800,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Wall-1200x800.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>PROOF GRAILS – WALL </p>"),
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
        "<p>Tyler Hobbs' Wall is part of the Grails by PROOF collection. Wall is a generative study of a photorealistic image, in this case of a wall from Austin, Texas, the artist's hometown. Hobbs' pursues the study of intricate patterns on a microscopic level, as he studies the varying differences in a brick wall, all of the nuanced changes in a seemingly homogeneous structure. What may seem fairly uniform from afar, is strikingly diverse when studied and scrutinized up close. Hobbs asserts that he could have spent an entire year analyzing all of the discrepancies and deviations from the norm that appear in a single brick wall. Wall features the various inconsistencies between the grouts of the brick, in the way the grout darkened nearer the middle of the wall where the artist imagined passers-by brushed past. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>The changing thickness of the lines, the slight variations of each brick, the changes in slant and shadow, and ultimately the distinctive splatter near the lower region of the piece excites the imagination to wonder what all number of spilled coffee, splattering paint, blood flying from a murder scene, splashed of muddy rainwater from trucks whizzing by might have contributed to the changes in the wall. This discovery of nuances within a grid-like structure, such as a brick wall, which inherently “seeks to be perfect” by its very nature of being, allows the viewer to spy natural discrepancies and errors that can occur in generative art. Even in the most perfect grid sequence, small deviations and alterations, even on a microcosmic level, can create an entire world of analytic study about the nature of patterns and the ways in which natural disruption can create chaos and unrest, contributing to what is essentially the heart and soul of art. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
