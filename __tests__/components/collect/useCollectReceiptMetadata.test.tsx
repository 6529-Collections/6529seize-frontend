import { useCollectReceiptMetadata } from "@/components/collect/useCollectReceiptMetadata";
import { loadCollectPlanMetadata } from "@/components/collect/collect-plan-metadata";
import type { CollectReceiptArtwork } from "@/components/collect/collect-receipt.helpers";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import {
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  GRADIENT_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/components/collect/collect-plan-metadata", () => ({
  loadCollectPlanMetadata: jest.fn(),
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));
const load = jest.mocked(loadCollectPlanMetadata);
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}
beforeEach(() => jest.clearAllMocks());

it.each([
  [MEMELAB_CONTRACT, ApiCollectFamily.Memelab],
  [MEMES_CONTRACT, ApiCollectFamily.Memes],
  [GRADIENT_CONTRACT, ApiCollectFamily.Gradients],
  [NEXTGEN_CONTRACT, ApiCollectFamily.Pebbles],
])(
  "recovers exact artwork metadata for %s without withholding the receipt",
  async (contract, family) => {
    let resolve!: (value: ApiCollectAsset[]) => void;
    load.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    const { wrapper, client } = setup();
    const assetKey = `1:${contract.toLowerCase()}:70`;
    const original: CollectReceiptArtwork = {
      assetKey,
      title: "",
      quantity: "1",
      recipients: [],
    };
    const { result } = renderHook(() => useCollectReceiptMetadata([original]), {
      wrapper,
    });
    expect(result.current[0]).toEqual(original);
    expect(load).toHaveBeenCalledWith([assetKey], expect.any(AbortSignal));
    const asset: ApiCollectAsset = {
      asset_key: assetKey,
      chain_id: 1,
      contract,
      token_id: "70",
      family,
      name: "Recovered artwork",
      image_url: "https://example.com/art.png",
      artist_ids: [],
      season: null,
      traits: [],
      hodl_rate: null,
      tdh_eligible: true,
    };
    await act(async () => resolve([asset]));
    await waitFor(() =>
      expect(result.current[0]?.title).toBe("Recovered artwork")
    );
    expect(result.current[0]?.media).toBeTruthy();
    expect(result.current[0]?.quantity).toBe(original.quantity);
    client.clear();
  }
);

it("keeps snapshotted artwork content and avoids unnecessary requests", () => {
  const { wrapper, client } = setup();
  const original = {
    assetKey: `1:${MEMES_CONTRACT.toLowerCase()}:545`,
    title: "Known artwork",
    media: <span>Artwork</span>,
    quantity: "1",
    recipients: [],
  };
  const { result } = renderHook(() => useCollectReceiptMetadata([original]), {
    wrapper,
  });
  expect(load).not.toHaveBeenCalled();
  expect(result.current[0]).toBe(original);
  client.clear();
});
