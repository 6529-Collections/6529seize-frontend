import Page, { generateMetadata } from "@/app/museum/genesis/subscapes/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / genesis / subscapes migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /SUBSCAPES/i,
      title: "SUBSCAPES - 6529.io",
    });
  });
});
