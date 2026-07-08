import Page, { generateMetadata } from "@/app/museum/genesis/kai-gen/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / kai gen migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /KAI-GEN/i,
      title: "KAI-GEN - 6529.io",
    });
  });
});
