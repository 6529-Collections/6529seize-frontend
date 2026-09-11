import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1TwinFlamesMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/twin-flames",
  title: "TWIN FLAMES",
  description:
    "Twin Flames Justin Aversano TWIN FLAMES #67 Blue Craig & Carey Smith Description Justin Aversano captures the mysterious and magical manifestation of twindom. Fascinated by the exact genetic timing and the presence of twins in storytelling and the ways in w...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>Twin Flames</strong><br>Justin Aversano </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Twin-Flames-67.jpg",
        alt: "6529.io",
        width: 600,
        height: 600,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Twin-Flames-67.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>TWIN FLAMES #67 </p>"),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Blue-Craig-Carey-Smith.jpg",
        alt: "6529.io",
        width: 600,
        height: 761,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Blue-Craig-Carey-Smith.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Blue Craig &amp; Carey Smith </p>"
      ),
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
        "<p>Justin Aversano captures the mysterious and magical manifestation of twindom. Fascinated by the exact genetic timing and the presence of twins in storytelling and the ways in which they almost defy biology, his photographs capture this bond and celebrate the uniqueness of being a twin. Craig &amp; Carey Smith 67 features a set of twins in black and white coats, one holding the other from behind, the other placing his hands to his heart. They both stare straight ahead and wear mysterious, sly smiles, as if they share secrets in their twindom that was captured by the lens. The background is grainy and out of focus, but the subjects stand clear and centered in the image. Blue Craig &amp; Carey Smith is clouded in a soft, foggy blue and bordered in water stained and distressed blue. One twin stands atop a stone ledge and holds the upturned face of his brother in his hand. Their pose is regal and elegant, as if there is a ritual being performed, some kind of indoctrination into their secret world, a world of twins that others cannot understand. As they are submerged in blue and indistinct, this further separates the duo into a detached and almost supernatural realm. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
