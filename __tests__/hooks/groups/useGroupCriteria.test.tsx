import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";

import { useGroupCriteria } from "@/hooks/groups/useGroupCriteria";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.Mock;

describe("useGroupCriteria", () => {
  it("returns public criteria synchronously for a null group id", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useGroupCriteria(null), { wrapper });

    expect(result.current).toEqual(
      expect.objectContaining({
        criteria: {
          group: null,
          includedWallets: [],
          excludedWallets: [],
        },
        isLoading: false,
        isError: false,
      })
    );
    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });
});
