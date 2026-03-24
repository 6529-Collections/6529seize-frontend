jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) =>
    url.startsWith("ipfs://")
      ? `https://gateway.example/ipfs/${url.slice("ipfs://".length)}`
      : url,
}));

import { getDropForgeStorageLocationInfo } from "@/components/drop-forge/drop-forge-storage-location.helpers";

describe("getDropForgeStorageLocationInfo", () => {
  it("treats bare transaction ids as arweave locations", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8"
      )
    ).toEqual({
      rawValue: "OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8",
      displayValue: "OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8",
      displayTitle: "OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8",
      provider: "arweave",
      providerBadgeLabel: null,
      openUrl:
        "https://arweave.net/OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8",
      copyValue:
        "https://arweave.net/OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8",
    });
  });

  it("shows only the root cid for ipfs protocol locations and resolves them to a gateway", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "ipfs://bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa"
      )
    ).toEqual({
      rawValue:
        "ipfs://bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      displayValue:
        "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      displayTitle:
        "ipfs://bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      provider: "ipfs",
      providerBadgeLabel: "IPFS",
      openUrl:
        "https://gateway.example/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      copyValue:
        "https://gateway.example/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
    });
  });

  it("recognizes ipfs gateway urls and extracts the cid for display", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "https://ipfs.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa"
      )
    ).toEqual({
      rawValue:
        "https://ipfs.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      displayValue:
        "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      displayTitle:
        "https://ipfs.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      provider: "ipfs",
      providerBadgeLabel: "IPFS",
      openUrl:
        "https://gateway.example/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      copyValue:
        "https://gateway.example/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
    });
  });

  it("strips arweave gateway prefixes for display but keeps an arweave target url", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "https://arweave.net/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc"
      )
    ).toEqual({
      rawValue:
        "https://arweave.net/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      displayValue: "OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      displayTitle:
        "https://arweave.net/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      provider: "arweave",
      providerBadgeLabel: null,
      openUrl:
        "https://arweave.net/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      copyValue:
        "https://arweave.net/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
    });
  });
});
