import Page, { generateMetadata } from "@/app/museum/genesis/pigments/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / pigments migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /PIGMENTS/i,
      title: "PIGMENTS - 6529.io",
    });
  });
});
