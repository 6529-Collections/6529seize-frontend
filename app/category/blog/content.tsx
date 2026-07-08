import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const categoryBlogMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/category/blog",
  title: "BLOG",
  description: "Archive of migrated 6529 blog posts.",
  section: "Archive",
  blocks: [
    {
      type: "heading",
      content: "Disney and DeeKay: Their Secret to Animation",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p> Disney and DeeKay: Their Secret to Animation by Sabrina Khan “I just want to make people smile with my animation and earn enough money [...]</p>"
      ),
    },
    {
      type: "heading",
      content: "FROM FIBONACCI TO FIDENZA",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p> From Fibonacci to Fidenza by Sabrina Khan There is an autonomous artist among us, a faceless, soulless creature, who, at the hands of talented [...]</p>"
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/XCOPY-summer-scaled.jpg",
        alt: "XCOPY summer artwork",
        width: 1455,
        height: 2560,
      },
    },
    {
      type: "heading",
      content: "A Tale of Two Artists – Van Gogh and XCOPY",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p> A Tale of Two Artists: Van Gogh and XCOPY by Sabrina Khan It is rare to meet someone who does not know Vincent Van [...]</p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
