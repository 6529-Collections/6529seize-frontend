import Page, { generateMetadata } from "@/app/museum/6529-fund-szn1/nuclear-nerds/page";
import { expectMigratedWordPressPageRenders } from "@/__tests__/pages/migratedWordPressPageTestUtils";

describe("museum / 6529 fund szn1 / nuclear nerds migrated WordPress page", () => {
  it("renders migrated WordPress content", async () => {
    await expectMigratedWordPressPageRenders({
      Component: Page,
      generateMetadata,
      heading: /NUCLEAR NERDS OF THE ACCIDENTAL APOCALYPSE/i,
      title: "NUCLEAR NERDS OF THE ACCIDENTAL APOCALYPSE - 6529.io",
    });
  });
});
