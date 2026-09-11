import Page, { generateMetadata } from "@/app/museum/temple-of-gm/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / temple of gm migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /TEMPLE OF GM/i,
      title: "TEMPLE OF GM - 6529.io",
    });
  });
});
