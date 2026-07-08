import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529FundSzn1ImageWithArrowMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-fund-szn1/image-with-arrow",
  title: "GANDINSKY - IMAGE WITH ARROW",
  description:
    "GANdinsky - Image with Arrow Coldie IMAGE WITH ARROW Description In GANdinsky Image with Arrow, artist Coldie collaborates with his favorite artist, Wassily Kandinsky, one of the pioneers of abstract painting in the early 20th century. Faithfully keeping Ka...",
  section: "Museum / 6529 Fund SZN1",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p><strong>GANdinsky – Image with Arrow</strong><br>Coldie </p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Image-with-Arrow.jpg",
        alt: "6529.io",
        width: 1024,
        height: 1220,
        href: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/08/Image-with-Arrow.jpg",
      },
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p>IMAGE WITH ARROW </p>"),
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
        "<p>In GANdinsky Image with Arrow, artist Coldie collaborates with his favorite artist, Wassily Kandinsky, one of the pioneers of abstract painting in the early 20th century. Faithfully keeping Kandinsky's vision in mind, Coldie uses modern technology to bring new life to a classic work with Playform GAN AI. Image with Arrow bears the hallmarks of high quality abstract art with striking geometric shapes, a white circle within a red and black circle, on top of a triangle. The shapes create a sense of motion even when perfectly still, as they sit on an ivory face and have a compass-like protrusion. The image is abstract but also industrial and mechanical in nature, almost like the inner workings of a watch or clock or some other technological feature that is beautified by color and shape. </p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
