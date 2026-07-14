import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/faraway/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / faraway migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /FARAWAY/i,
      title: "FARAWAY - 6529.io",
    });
  });
});
