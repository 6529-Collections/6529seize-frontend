import Page, { generateMetadata } from "@/app/museum/genesis/apparitions/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / apparitions migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /APPARITIONS/i,
      title: "APPARITIONS - 6529.io",
    });
  });
});
