import Page, { generateMetadata } from "@/app/museum/imagined-worlds/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / imagined worlds migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /IMAGINED WORLDS/i,
      title: "IMAGINED WORLDS - 6529.io",
    });
  });
});
