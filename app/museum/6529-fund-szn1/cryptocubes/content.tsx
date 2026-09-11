import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1CryptocubesMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/cryptocubes",
  title: "CRYPTOCUBES",
  description:
    "CryptoCubes Han CRYPTOCUBE #36 Description CryptoCubes, the creation of Han RGB, allows artists to present their work on 3D platforms, encapsulating the excitement of cryptoart and celebrating the potential of NFTs in the digital art landscape. CryptoCube 3...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>CryptoCubes</strong><br>Han </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/CryptoCube-39.gif",
        alt: "6529.io",
        width: 480,
        height: 480,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/CryptoCube-39.gif",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>CRYPTOCUBE #36 </p>"),
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
        "<p>CryptoCubes, the creation of Han RGB, allows artists to present their work on 3D platforms, encapsulating the excitement of cryptoart and celebrating the potential of NFTs in the digital art landscape. CryptoCube 36 is a series of fractured cubes that are in a variety of sizes, all stationed evenly apart from one another, bright neon pink, tangerine, and pearlescent pink. It spins every second in a full orbit before pausing and spinning again. The colors are bright and festive, mixed in variety, and of the A shape type, resembling a Rubix cube that was shattered and then frozen in midair, all the disjointed pieces afloat and refusing to separate. Set against a grainy TV channel background of white noise, the object floats forever in this nebulous space, a spot of bright, moving excitement in a new and unexplored vastness of endless possibility. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
