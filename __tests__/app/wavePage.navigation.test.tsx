import WavePage from "@/app/waves/[wave]/page";
import { headers } from "next/headers";
import { renderWavesPageContent } from "@/app/waves/waves-page.shared";

jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("@/app/waves/waves-page.shared", () => ({
  renderWavesPageContent: jest.fn(),
}));

it.each([
  ["empty", false],
  ["document", true],
  [null, true],
] as const)(
  "keeps public previews on documents and crawler requests, off browser fetches (destination=%s)",
  async (destination, includePublicPreview) => {
    jest
      .mocked(headers)
      .mockResolvedValue(
        new Headers(
          destination ? { "sec-fetch-dest": destination } : {}
        ) as Awaited<ReturnType<typeof headers>>
      );
    await WavePage({
      params: Promise.resolve({ wave: "wave" }),
      searchParams: Promise.resolve({ tab: "chat", competition: "selected" }),
    });
    expect(renderWavesPageContent).toHaveBeenLastCalledWith({
      waveId: "wave",
      searchParams: { tab: "chat", competition: "selected" },
      routeContext: "waves",
      includePublicPreview,
      includeServerFeedSeed: includePublicPreview,
    });
  }
);
