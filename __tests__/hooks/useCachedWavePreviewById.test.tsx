import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useCachedWavePreviewById } from "@/hooks/useCachedWavePreviewById";

const createWrapper = (client: QueryClient) =>
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

describe("useCachedWavePreviewById", () => {
  it("returns a wave preview from cached waves v2 list data", () => {
    const client = new QueryClient();
    const wavePreview = {
      id: "wave-1",
      name: "Cached wave",
      totalDropsCount: 7,
    };

    client.setQueryData([QueryKey.WAVES_V2, { view: "OVERVIEW" }], {
      pages: [{ waves: [wavePreview] }],
      pageParams: [1],
    });

    const { result } = renderHook(
      () => useCachedWavePreviewById("wave-1"),
      { wrapper: createWrapper(client) }
    );

    expect(result.current.wavePreview).toMatchObject(wavePreview);
  });

  it("returns undefined when the wave is not cached", () => {
    const client = new QueryClient();

    const { result } = renderHook(
      () => useCachedWavePreviewById("missing-wave"),
      { wrapper: createWrapper(client) }
    );

    expect(result.current.wavePreview).toBeUndefined();
  });
});
