import Page, { generateMetadata } from "@/app/museum/genesis/frammenti/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / frammenti migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /FRAMMENTI/i,
      title: "FRAMMENTI - 6529.io",
    });
  });
});
