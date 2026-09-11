import Page, { generateMetadata } from "@/app/museum/genesis/singularity/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / singularity migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /SINGULARITY/i,
      title: "SINGULARITY - 6529.io",
    });
  });
});
