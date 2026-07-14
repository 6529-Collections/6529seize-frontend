import { migratedWordPressTrustedHtml } from "@/components/migrated-wordpress/trusted-html";
import type { MigratedWordPressStaticPageContent } from "@/components/migrated-wordpress/types";

export const museumGenesisSecretSurpriseMigratedWordPressPage = {
  source: "migrated-wordpress",
  path: "/museum/genesis/secret-surprise",
  title: "SECRET SURPRISE",
  description:
    "Secret Surprise is, well, a surprise 😊 It is a very special and rare work of generative art that you can view by visiting the Genesis gallery. VISIT THE GENESIS GALLERY",
  section: "Museum / Genesis",
  blocks: [
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>Secret Surprise is, well, a surprise 😊 </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        "<p>It is a very special and rare work of generative art that you can view by visiting the Genesis gallery. </p>"
      ),
    },
    {
      type: "html",
      html: migratedWordPressTrustedHtml(
        '<p><a href="https://oncyber.io/6529MuseumDistrict?coords=116.87x2.8x190.55x-1.56" rel="noopener noreferrer" target="_blank" data-migrated-wordpress-button>VISIT THE GENESIS GALLERY </a></p>'
      ),
    },
  ],
} satisfies MigratedWordPressStaticPageContent;
