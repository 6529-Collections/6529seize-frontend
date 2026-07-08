import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/ringers/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / ringers migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /RINGERS/i,
      title: "RINGERS - 6529.io",
    });
  });
});
