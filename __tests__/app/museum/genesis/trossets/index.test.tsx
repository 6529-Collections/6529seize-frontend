import Page, { generateMetadata } from "@/app/museum/genesis/trossets/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / trossets migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /TROSSETS/i,
      title: "TROSSETS - 6529.io",
    });
  });
});
