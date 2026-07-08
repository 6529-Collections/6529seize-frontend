import { createMigratedWordPressStaticPage } from "@/components/migrated-wordpress/createMigratedWordPressStaticPage";
import { museum_6529FundSzn2MigratedWordPressPage as content } from "./content";

const migratedPage = createMigratedWordPressStaticPage(content);

export default migratedPage.Page;

export function generateMetadata() {
  return migratedPage.generateMetadata();
}
