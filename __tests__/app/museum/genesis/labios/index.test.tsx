import Page, { generateMetadata } from "@/app/museum/genesis/labios/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / labios migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /LABIOS/i,
      title: "LABIOS - 6529.io",
    });
  });
});
