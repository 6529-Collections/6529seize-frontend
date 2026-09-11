import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/non-either/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / non either migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /NON EITHER/i,
      title: "NON EITHER - 6529.io",
    });
  });
});
