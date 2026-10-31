import { createMigratedWordPressStaticPage } from "@/components/migrated-wordpress/createMigratedWordPressStaticPage";
import MuseumLegacyEntryPoint from "@/components/museum/MuseumLegacyEntryPoint";
import { museumMigratedWordPressPage as content } from "./content";

export const dynamic = "force-static";

const migratedPage = createMigratedWordPressStaticPage(content);

export default function MuseumPage() {
  return (
    <>
      <MuseumLegacyEntryPoint />
      <migratedPage.Page />
    </>
  );
}

export function generateMetadata() {
  return migratedPage.generateMetadata();
}
