import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const emailSignaturesMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/email-signatures",
  title: "EMAIL SIGNATURES",
  description:
    "Please copy and paste the below signature template in the Email Signatures section of your email client, and swap the information for your own (you can delete the phone line if you don't want to list your phone).",
  section: "Resources",
  heroImage: {
    src: "https://dnclu2fna0b2b.cloudfront.net/wp-content/uploads/2022/06/6529-Email-Signature.png",
    alt: "EMAIL SIGNATURES",
    width: 100,
    height: 100,
  },
  blocks: [
    {
      type: "heading",
      content: "CREATE YOUR 6529 TEAM EMAIL SIGNATURE",
    },
    {
      type: "heading",
      content: "THIS IS MEANT FOR 6529 TEAM MEMBERS",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Please copy and paste the below signature template in the Email Signatures section of your email client, and swap the information for your own (you can delete the phone line if you don't want to list your phone).</p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml("<p><strong>Notes:</strong></p>"),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<ul><li>If using Apple Mail or iOS, copy and paste from this page in Safari, or else the formatting won't translate</li><li>A vertical signature is also included, as some email clients don't honor HTML tables in email signatures</li><li>On some email clients, after you copy and paste, you may need to re-bold some elements to achieve the below look</li></ul>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>For assistance, reach out to 6529er.</p>"
      ),
    },
    {
      type: "heading",
      content: "HORIZONTAL SIGNATURE",
    },
    {
      type: "heading",
      content: "VERTICAL SIGNATURE",
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><strong>6529er</strong><br><strong>e</strong> <a href="mailto:6529er@6529.io">6529er@6529.io</a><br><strong>t</strong> @6529er<br><strong>p </strong>+1 (234) 567 8910<br><strong>w</strong> www.6529.io</p>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
