import {
  getWaveDropsInitialLimit,
  WAVE_DROPS_NATIVE_INITIAL_PARAMS,
  WAVE_DROPS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";

describe("wave drop query params", () => {
  it("keeps desktop initial wave drops at the default page size", () => {
    expect(getWaveDropsInitialLimit(false)).toBe(WAVE_DROPS_PARAMS.limit);
  });

  it("uses the reduced initial page size on native", () => {
    expect(getWaveDropsInitialLimit(true)).toBe(
      WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit
    );
    expect(WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit).toBeLessThan(
      WAVE_DROPS_PARAMS.limit
    );
  });
});
