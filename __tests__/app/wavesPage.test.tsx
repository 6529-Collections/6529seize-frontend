import WavesPage, { generateMetadata } from "@/app/waves/page";
import { redirect } from "next/navigation";
import {
  buildWavesMetadata,
  renderWavesPageContent,
} from "@/app/waves/waves-page.shared";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("@/app/waves/waves-page.shared", () => ({
  buildWavesMetadata: jest.fn(),
  getFirstSearchParamValue: jest.requireActual("@/app/waves/waves-page.shared")
    .getFirstSearchParamValue,
  renderWavesPageContent: jest.fn(),
}));

describe("Waves page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects legacy wave query routes to canonical wave paths", async () => {
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      WavesPage({
        searchParams: Promise.resolve({
          wave: "test-wave-123",
          serialNo: "42",
          divider: "7",
        }),
      } as any)
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      "/waves/test-wave-123?serialNo=42&divider=7"
    );
    expect(renderWavesPageContent).not.toHaveBeenCalled();
  });

  it("renders waves list when no legacy wave query exists", async () => {
    (renderWavesPageContent as jest.Mock).mockResolvedValue("waves-content");

    const result = await WavesPage({
      searchParams: Promise.resolve({ drop: "drop-1" }),
    } as any);

    expect(renderWavesPageContent).toHaveBeenCalledWith({
      waveId: null,
      searchParams: { drop: "drop-1" },
    });
    expect(result).toBe("waves-content");
  });

  it("builds metadata from the legacy wave query when present", async () => {
    const metadata = { title: "Wave title" };
    (buildWavesMetadata as jest.Mock).mockResolvedValue(metadata);

    const result = await generateMetadata({
      searchParams: Promise.resolve({ wave: "w-1" }),
    } as any);

    expect(buildWavesMetadata).toHaveBeenCalledWith("w-1");
    expect(result).toEqual(metadata);
  });
});
