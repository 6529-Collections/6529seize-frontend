import { createMigratedWordPressStaticPage } from "@/components/migrated-wordpress/createMigratedWordPressStaticPage";
import { museum_6529FundSzn1NonEitherMigratedWordPressPage as content } from "./content";

export const dynamic = "force-static";

const migratedPage = createMigratedWordPressStaticPage(content);

export default migratedPage.Page;

export function generateMetadata() {
  return migratedPage.generateMetadata();
}
