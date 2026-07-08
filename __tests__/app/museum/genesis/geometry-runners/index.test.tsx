import Page, { generateMetadata } from "@/app/museum/genesis/geometry-runners/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / geometry runners migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /GEOMETRY RUNNERS/i,
      title: "GEOMETRY RUNNERS - 6529.io",
    });
  });
});
