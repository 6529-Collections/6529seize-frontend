import WavePage, { generateMetadata } from "@/app/waves/[wave]/page";
import {
  buildWavesMetadata,
  renderWavesPageContent,
} from "@/app/waves/waves-page.shared";

jest.mock("@/app/waves/waves-page.shared", () => ({
  buildWavesMetadata: jest.fn(),
  renderWavesPageContent: jest.fn(),
}));

describe("Wave page", () => {
  it("renders shared waves page content for a wave route", async () => {
    (renderWavesPageContent as jest.Mock).mockResolvedValue("wave-content");

    const result = await WavePage({
      params: Promise.resolve({ wave: "test-wave-123" }),
      searchParams: Promise.resolve({ serialNo: "42" }),
    } as any);

    expect(renderWavesPageContent).toHaveBeenCalledWith({
      waveId: "test-wave-123",
      searchParams: { serialNo: "42" },
    });
    expect(result).toBe("wave-content");
  });

  it("delegates metadata generation to shared helper", async () => {
    const metadata = { title: "Wave metadata" };
    (buildWavesMetadata as jest.Mock).mockResolvedValue(metadata);

    const result = await generateMetadata({
      params: Promise.resolve({ wave: "test-wave-123" }),
    } as any);

    expect(buildWavesMetadata).toHaveBeenCalledWith("test-wave-123");
    expect(result).toEqual(metadata);
  });
});
