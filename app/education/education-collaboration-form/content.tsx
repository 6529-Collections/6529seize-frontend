import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const educationEducationCollaborationFormMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/education/education-collaboration-form",
  title: "EDUCATION COLLABORATION FORM",
  description:
    "Education, research, advocacy, and policy collaboration inquiries for 6529.",
  section: "Education",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p>If you would like to collaborate with 6529 to help educate or conduct research in the fields of cryptocurrency, digital rights, NFTs, Web3, metaverse, or related topics, please email <a href="mailto:support@6529.io">support@6529.io</a>.</p>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
