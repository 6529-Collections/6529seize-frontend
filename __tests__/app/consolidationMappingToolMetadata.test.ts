import { generateMetadata } from "@/app/consolidation-mapping-tool/page";
import { publicEnv } from "@/config/env";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

jest.mock("@/app/consolidation-mapping-tool/page.client", () => ({
  __esModule: true,
  default: () => null,
}));

describe("consolidation mapping tool metadata", () => {
  it("describes what the tool does", async () => {
    const metadata = await generateMetadata();
    const domain = new URL(publicEnv.BASE_ENDPOINT).hostname;

    expect(metadata.title).toBe("Consolidation Mapping Tool | Tools");
    expect(metadata.description).toBe(
      `${t(DEFAULT_LOCALE, "pageMetadata.consolidationMappingTool.description")} | ${domain}`
    );
  });
});
