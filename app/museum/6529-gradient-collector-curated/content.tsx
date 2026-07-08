import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museum_6529GradientCollectorCuratedMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/6529-gradient-collector-curated",
  title: "6529 GRADIENT COLLECTOR CURATED",
  description:
    "6529 GRADIENT COLLECTOR CURATED 6529 Gradient Collector Curated is the gallery curated by holders of 6529 Gradients. Each Gradient holder can place 1 item in the gallery per Gradient held. VISIT 6529 GRADIENT COLLECTOR CURATED",
  section: "Museum",
  blocks: [
    {
      type: "heading",
      content: "6529 GRADIENT COLLECTOR CURATED",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>6529 Gradient Collector Curated is the gallery curated by holders of 6529 Gradients. Each Gradient holder can place 1 item in the gallery per Gradient held. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529om?coords=80.16x2.8x-97.23x0.05" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT 6529 GRADIENT COLLECTOR CURATED </a></p>'
      ),
    },
    {
      type: "image",
      media: {
        src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/6529-Gradients-Screenshot.jpg",
        alt: "6529.io",
        width: 1920,
        height: 954,
        href: "https://oncyber.io/6529om?coords=80.16x2.8x-97.23x0.05",
      },
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
