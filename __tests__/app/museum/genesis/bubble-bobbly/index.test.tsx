import Page, { generateMetadata } from "@/app/museum/genesis/bubble-bobbly/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / bubble bobbly migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /BUBBLE BOBBLY/i,
      title: "BUBBLE BOBBLY - 6529.io",
    });
  });
});
