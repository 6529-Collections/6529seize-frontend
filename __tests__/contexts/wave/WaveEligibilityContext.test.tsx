import { act, renderHook } from "@testing-library/react";
import {
  useWaveEligibility,
  WaveEligibilityProvider,
} from "@/contexts/wave/WaveEligibilityContext";
import { commonApiFetch } from "@/services/api/common-api";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const wrapper = ({ children }: { readonly children: React.ReactNode }) => (
  <WaveEligibilityProvider>{children}</WaveEligibilityProvider>
);

describe("WaveEligibilityProvider", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("clears viewer-specific eligibility when the profile switches", () => {
    const { result } = renderHook(() => useWaveEligibility(), { wrapper });

    act(() => {
      result.current.updateEligibility("wave-1", {
        authenticated_user_eligible_to_chat: true,
      });
    });
    expect(result.current.getEligibility("wave-1")).not.toBeNull();

    act(() => {
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
    });

    expect(result.current.getEligibility("wave-1")).toBeNull();
  });

  it("discards eligibility fetched for the previous profile", async () => {
    let resolveWave!: (wave: ApiWave) => void;
    (commonApiFetch as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveWave = resolve;
      })
    );
    const { result } = renderHook(() => useWaveEligibility(), { wrapper });
    let refresh!: Promise<void>;

    act(() => {
      refresh = result.current.refreshEligibility("wave-1");
    });
    act(() => {
      globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
      resolveWave({
        chat: { authenticated_user_eligible: true },
        voting: { authenticated_user_eligible: true },
        participation: { authenticated_user_eligible: true },
      } as ApiWave);
    });
    await act(async () => refresh);

    expect(result.current.getEligibility("wave-1")).toBeNull();
  });
});
