import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const aboutMediaMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/about/media",
  title: "MEDIA CENTER",
  description:
    "Media requests (podcasts, conferences, interviews or comments on specific topics) can be sent to support@6529.io.",
  section: "About",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Official brand collateral for use in publications is below:</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><strong>Punk 6529</strong><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Punk6529.png" rel="noopener noreferrer" target="_blank">Punk with background</a><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/04/Punk6529-nobg.png" rel="noopener noreferrer" target="_blank">Punk no background</a></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><strong>6529 Logo</strong><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/09/6529-logo.png" rel="noopener noreferrer" target="_blank">Black on white</a><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/09/6529-logo-rev.png" rel="noopener noreferrer" target="_blank">White on black</a><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/09/6529-Final-Logo.png" rel="noopener noreferrer" target="_blank">Black no background</a><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2021/09/6529-Final-Logo-rev.png" rel="noopener noreferrer" target="_blank">White no background</a><br></p>'
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><strong>OM Logo</strong><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/OM-Logo-Black-white-bg.png" rel="noopener noreferrer" target="_blank">Black on white</a><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/OM-Logo-White-black-bg.png" rel="noopener noreferrer" target="_blank">White on black</a><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/OM-Logo-Black-no-bg.png" rel="noopener noreferrer" target="_blank">Black no background</a><br><a href="https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/10/OM-Logo-White-no-bg.png" rel="noopener noreferrer" target="_blank">White no background</a><br></p>'
      ),
    },
    {
      type: "heading",
      content: "MEDIA REQUESTS",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p>For media requests, email <a href="mailto:support@6529.io">support@6529.io</a>.</p>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
