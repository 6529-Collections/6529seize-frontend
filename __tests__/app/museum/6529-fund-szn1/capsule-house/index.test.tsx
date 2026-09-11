import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/capsule-house/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / capsule house migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /CAPSULE HOUSE/i,
      title: "CAPSULE HOUSE - 6529.io",
    });
  });
});
