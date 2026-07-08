import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/where-my-vans-go/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / where my vans go migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /WHERE MY VANS GO/i,
      title: "WHERE MY VANS GO - 6529.io",
    });
  });
});
