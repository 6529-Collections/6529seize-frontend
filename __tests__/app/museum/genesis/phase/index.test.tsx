import Page, { generateMetadata } from "@/app/museum/genesis/phase/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / phase migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /PHASE/i,
      title: "PHASE - 6529.io",
    });
  });
});
