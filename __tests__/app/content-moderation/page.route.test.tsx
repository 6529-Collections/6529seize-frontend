import ContentModerationPage from "@/app/content-moderation/[[...tab]]/page";
import ContentModerationPageClient from "@/app/content-moderation/page.client";
import {
  getModerationTab,
  getModerationTabPath,
  MODERATION_TAB_SLUGS,
} from "@/app/content-moderation/content-moderation-tabs";

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn(() => ({})),
}));
jest.mock("@/app/content-moderation/page.client", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("shared content moderation route", () => {
  it.each(
    [
      undefined,
      [],
      ...Object.values(MODERATION_TAB_SLUGS).map((slug) => [slug]),
    ].map((tab) => ({ tab }))
  )("renders the same client screen for $tab", async ({ tab }) => {
    const result = await ContentModerationPage({
      params: Promise.resolve(tab === undefined ? {} : { tab }),
    });
    expect(result.type).toBe(ContentModerationPageClient);
  });

  it.each(
    [["unknown"], ["OPEN"], ["block-activity", "extra"]].map((tab) => ({ tab }))
  )("rejects invalid route segments $tab", async ({ tab }) => {
    await expect(
      ContentModerationPage({ params: Promise.resolve({ tab }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("maps only supported tab slugs and defaults the root to Open reports", () => {
    expect(getModerationTab()).toBe("OPEN");
    expect(getModerationTab("unknown")).toBeNull();
    expect(getModerationTab("toString")).toBeNull();
    for (const slug of Object.values(MODERATION_TAB_SLUGS)) {
      const tab = getModerationTab(slug);
      expect(tab).not.toBeNull();
      if (tab !== null)
        expect(getModerationTabPath(tab)).toBe(`/content-moderation/${slug}`);
    }
  });
});
