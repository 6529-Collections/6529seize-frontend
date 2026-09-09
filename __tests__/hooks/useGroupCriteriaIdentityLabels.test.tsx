import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createTestQueryClient } from "@/__tests__/utils/reactQuery";
import { useGroupCriteriaIdentityLabels } from "@/hooks/useGroupCriteriaIdentityLabels";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

describe("useGroupCriteriaIdentityLabels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves and deduplicates wallet-based criteria identities", async () => {
    const wallet = "0xfd22004806a6846ea67ad883356be810f0428793";
    jest.mocked(commonApiFetch).mockResolvedValue({
      handle: "pinkapewife",
    });
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const group = {
      rep: { user_identity: `0x${wallet.slice(2).toUpperCase()}` },
      cic: { user_identity: wallet },
    } as never;

    const { result } = renderHook(() => useGroupCriteriaIdentityLabels(group), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({ [wallet]: "pinkapewife" });
    });
    expect(commonApiFetch).toHaveBeenCalledTimes(1);
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `identities/${wallet}`,
    });
  });

  it("does not fetch identities that are already handles", () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const group = {
      rep: { user_identity: "punk6529" },
      cic: { user_identity: null },
    } as never;

    const { result } = renderHook(() => useGroupCriteriaIdentityLabels(group), {
      wrapper,
    });

    expect(result.current).toEqual({});
    expect(commonApiFetch).not.toHaveBeenCalled();
  });
});
