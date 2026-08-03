import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";

import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";

describe("useTokenMetadataQuery", () => {
  it("keeps an empty disabled token query idle", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useTokenMetadataQuery({ tokens: [], enabled: false }),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe("idle");
  });
});
