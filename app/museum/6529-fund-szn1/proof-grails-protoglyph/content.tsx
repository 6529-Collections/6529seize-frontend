import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1ProofGrailsProtoglyphMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/proof-grails-protoglyph",
  title: "PROOF GRAILS - PROTOGLYPH",
  description:
    "Proof Grails - Protoglyph Larva Labs PROOF GRAILS - PROTOGLYPH Description LarvaLabs presents one of the earliest algorithm explorations for the Autoglyphs, a high-resolution and extremely detailed output. With rising black and white stripes that leap from...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Proof Grails – Protoglyph</strong><br>Larva Labs </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Protoglyph-1200x1200.png",
        alt: "6529.io",
        width: 1200,
        height: 1200,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Protoglyph-1200x1200.png",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>PROOF GRAILS – PROTOGLYPH </p>"),
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
        "<p>LarvaLabs presents one of the earliest algorithm explorations for the Autoglyphs, a high-resolution and extremely detailed output. With rising black and white stripes that leap from the foreground, the lines carry the eye up into a super galactic array of dizzying swirls and stars that grow smaller and smaller as if one is floating through a star-spin, glittering tunnel of kaleidoscopic diamond tessellations. Nearly every inch of the image is detailed and every line creates a hypnotic and surreal effect. The closely detailed lines rising and falling make the image feel as if it is alive with motion taking the viewer on a 3D trip through space and time. As such highly detailed and high-resolution images are a challenge to store on-chain, the methods have since changed to accommodate, but Protoglyph serves as a unique piece that showcases some of that early, extremely detailed work. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
