import { createMigratedWordPressStaticPage } from "@/components/migrated-wordpress/createMigratedWordPressStaticPage";
import { museumBharatKrymoMuseum2MigratedWordPressPage as content } from "./content";

export const dynamic = "force-static";

const migratedPage = createMigratedWordPressStaticPage(content);

export default migratedPage.Page;

export function generateMetadata() {
  return migratedPage.generateMetadata();
}
