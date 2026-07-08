import Page, { generateMetadata } from "@/app/museum/genesis/gazers/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / gazers migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /GAZERS/i,
      title: "GAZERS - 6529.io",
    });
  });
});
