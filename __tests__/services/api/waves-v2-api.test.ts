import {
  createWaveMetadata,
  deleteWaveMetadata,
  fetchWaveMetadata,
} from "@/services/api/waves-v2-api";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api");

const mockedCommonApiFetch = commonApiFetch as jest.Mock;
const mockedCommonApiPost = commonApiPost as jest.Mock;
const mockedCommonApiDelete = commonApiDelete as jest.Mock;

describe("waves-v2-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches wave metadata", async () => {
    mockedCommonApiFetch.mockResolvedValue([]);

    await expect(fetchWaveMetadata({ waveId: "wave-1" })).resolves.toEqual([]);

    expect(mockedCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata",
      headers: undefined,
    });
  });

  it("creates wave metadata", async () => {
    const response = { id: 1, data_key: "key", data_value: "value" };
    const body = { data_key: "key", data_value: "value" };
    mockedCommonApiPost.mockResolvedValue(response);

    await expect(
      createWaveMetadata({ waveId: "wave-1", body })
    ).resolves.toEqual(response);

    expect(mockedCommonApiPost).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata",
      body,
      headers: undefined,
    });
  });

  it("deletes wave metadata", async () => {
    mockedCommonApiDelete.mockResolvedValue(undefined);

    await expect(
      deleteWaveMetadata({ waveId: "wave-1", metadataId: 7 })
    ).resolves.toBeUndefined();

    expect(mockedCommonApiDelete).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata/7",
      headers: undefined,
    });
  });
});
