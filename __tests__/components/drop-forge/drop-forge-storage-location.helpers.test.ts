import { getDropForgeStorageLocationInfo } from "@/components/drop-forge/drop-forge-storage-location.helpers";

describe("getDropForgeStorageLocationInfo", () => {
  it("returns null for empty inputs", () => {
    expect(getDropForgeStorageLocationInfo(null)).toBeNull();
    expect(getDropForgeStorageLocationInfo(undefined)).toBeNull();
    expect(getDropForgeStorageLocationInfo("")).toBeNull();
    expect(getDropForgeStorageLocationInfo("   ")).toBeNull();
  });

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
        "https://media.6529.io/arweave/OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8",
      copyValue:
        "https://media.6529.io/arweave/OI6-rpJ2C3Ab4HiZRWt5A1SumhjnYigmSPBPX0ICBj8",
    });
  });

  it("does not fabricate arweave resolver URLs for unrecognized raw values", () => {
    expect(getDropForgeStorageLocationInfo("not-a-valid-location")).toEqual({
      rawValue: "not-a-valid-location",
      displayValue: "not-a-valid-location",
      displayTitle: "not-a-valid-location",
      provider: null,
      providerBadgeLabel: null,
      openUrl: null,
      copyValue: "not-a-valid-location",
    });
  });

  it("treats ar:// locations as arweave locations", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "ar://OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc"
      )
    ).toEqual({
      rawValue: "ar://OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      displayValue: "OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      displayTitle: "ar://OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      provider: "arweave",
      providerBadgeLabel: null,
      openUrl:
        "https://media.6529.io/arweave/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      copyValue:
        "https://media.6529.io/arweave/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
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
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      copyValue:
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
    });
  });

  it("preserves suffix paths for ipfs protocol locations", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "ipfs://bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png"
      )
    ).toEqual({
      rawValue:
        "ipfs://bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png",
      displayValue:
        "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      displayTitle:
        "ipfs://bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png",
      provider: "ipfs",
      providerBadgeLabel: "IPFS",
      openUrl:
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png",
      copyValue:
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png",
    });
  });

  it("treats bare ipfs cids as ipfs locations", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa"
      )
    ).toEqual({
      rawValue: "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      displayValue:
        "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      displayTitle:
        "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      provider: "ipfs",
      providerBadgeLabel: "IPFS",
      openUrl:
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      copyValue:
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
    });

    expect(
      getDropForgeStorageLocationInfo(
        "QmYwAPJzv5CZsnAzt8auVZRnG1R8n4wqxW48UUfZo59SyY"
      )
    ).toEqual({
      rawValue: "QmYwAPJzv5CZsnAzt8auVZRnG1R8n4wqxW48UUfZo59SyY",
      displayValue: "QmYwAPJzv5CZsnAzt8auVZRnG1R8n4wqxW48UUfZo59SyY",
      displayTitle: "QmYwAPJzv5CZsnAzt8auVZRnG1R8n4wqxW48UUfZo59SyY",
      provider: "ipfs",
      providerBadgeLabel: "IPFS",
      openUrl:
        "https://media.6529.io/ipfs/QmYwAPJzv5CZsnAzt8auVZRnG1R8n4wqxW48UUfZo59SyY",
      copyValue:
        "https://media.6529.io/ipfs/QmYwAPJzv5CZsnAzt8auVZRnG1R8n4wqxW48UUfZo59SyY",
    });
  });

  it("keeps bare CIDv1 values as IPFS even though they match the Arweave length range", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa"
      )?.provider
    ).toBe("ipfs");
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
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      copyValue:
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
    });
  });

  it("preserves suffix paths for ipfs gateway urls", () => {
    expect(
      getDropForgeStorageLocationInfo(
        "https://ipfs.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png"
      )
    ).toEqual({
      rawValue:
        "https://ipfs.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png",
      displayValue:
        "bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa",
      displayTitle:
        "https://ipfs.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png",
      provider: "ipfs",
      providerBadgeLabel: "IPFS",
      openUrl:
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png",
      copyValue:
        "https://media.6529.io/ipfs/bafybeifnoqgl2rnnredlcwqhujosdwbpufoqkvbgoeohcnepq5yexlt6wa/dir/file.png",
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
        "https://media.6529.io/arweave/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
      copyValue:
        "https://media.6529.io/arweave/OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc",
    });
  });
});
