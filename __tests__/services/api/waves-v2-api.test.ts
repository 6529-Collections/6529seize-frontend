import {
  createWaveMetadata,
  fetchWaveMetadata,
} from "@/services/api/waves-v2-api";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/api/common-api");

const mockedCommonApiFetch = commonApiFetch as jest.Mock;
const mockedCommonApiPost = commonApiPost as jest.Mock;

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
});
