import Page, { generateMetadata } from "@/app/museum/yongoh-kim/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / yongoh kim migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /YONGOH KIM/i,
      title: "YONGOH KIM - 6529.io",
    });
  });
});
