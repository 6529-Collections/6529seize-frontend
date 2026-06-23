import {
  fitArtworkToFrame,
  getCmsPerformanceBudgetBytes,
  getCmsRoomPreset,
} from "@/lib/profile-cms/runtime/threeD";

describe("profile CMS 3D runtime helpers", () => {
  it("preserves wide artwork aspect ratio inside a square frame", () => {
    const fit = fitArtworkToFrame({
      frameHeight: 1.2,
      frameWidth: 1.2,
      naturalHeight: 900,
      naturalWidth: 1600,
    });

    expect(fit.width).toBeCloseTo(1.2);
    expect(fit.height).toBeCloseTo(0.675);
    expect(fit.aspectRatio).toBeCloseTo(16 / 9);
  });

  it("preserves tall artwork aspect ratio inside a wide frame", () => {
    const fit = fitArtworkToFrame({
      frameHeight: 1,
      frameWidth: 2,
      naturalHeight: 1800,
      naturalWidth: 900,
    });

    expect(fit.width).toBeCloseTo(0.5);
    expect(fit.height).toBeCloseTo(1);
    expect(fit.aspectRatio).toBeCloseTo(0.5);
  });

  it("falls back to the wall preset and parses byte budgets", () => {
    expect(getCmsRoomPreset("unknown").key).toBe("wall");
    expect(getCmsPerformanceBudgetBytes({ max_model_bytes: "2500000" })).toBe(
      2500000
    );
  });
});
