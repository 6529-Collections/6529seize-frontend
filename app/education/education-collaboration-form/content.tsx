import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const educationEducationCollaborationFormMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/education/education-collaboration-form",
  title: "EDUCATION COLLABORATION FORM",
  description:
    "If you would like to collaborate with 6529 to help educate or conduct research in the fields of cryptocurrecny, digital rights, NFTs or metaverse, please fill in the form below:",
  section: "Education",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>If you would like to collaborate with 6529 to help educate or conduct research in the fields of cryptocurrecny, digital rights, NFTs or metaverse, please fill in the form below:</p>"
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
