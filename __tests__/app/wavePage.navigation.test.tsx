import WavePage from "@/app/waves/[wave]/page";
import { headers } from "next/headers";
import { renderWavesPageContent } from "@/app/waves/waves-page.shared";

jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("@/app/waves/waves-page.shared", () => ({
  renderWavesPageContent: jest.fn(),
}));

it.each([true, false])(
  "keeps public previews on document responses and skips them for RSC transitions (RSC=%s)",
  async (rsc) => {
    jest
      .mocked(headers)
      .mockResolvedValue(
        new Headers(rsc ? { rsc: "1" } : {}) as Awaited<
          ReturnType<typeof headers>
        >
      );
    await WavePage({
      params: Promise.resolve({ wave: "wave" }),
      searchParams: Promise.resolve({ tab: "chat", competition: "selected" }),
    });
    expect(renderWavesPageContent).toHaveBeenLastCalledWith({
      waveId: "wave",
      searchParams: { tab: "chat", competition: "selected" },
      routeContext: "waves",
      includePublicPreview: !rsc,
    });
  }
);
