import { createMigratedWordPressStaticPage } from "@/components/migrated-wordpress/createMigratedWordPressStaticPage";
import { museumGenesisGreatHallOfGenerativeArtMigratedWordPressPage as content } from "./content";

export const dynamic = "force-static";

const migratedPage = createMigratedWordPressStaticPage(content);

export default migratedPage.Page;

export function generateMetadata() {
  return migratedPage.generateMetadata();
}
