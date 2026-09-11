import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/cryptocubes/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / cryptocubes migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /CRYPTOCUBES/i,
      title: "CRYPTOCUBES - 6529.io",
    });
  });
});
