import { ApiSubwavesSort } from "@/generated/models/ApiSubwavesSort";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import {
  createWaveMetadata,
  deleteWaveMetadata,
  fetchWaveMetadata,
  fetchWaveSubwavesPage,
} from "@/services/api/waves-v2-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiDelete: jest.fn(),
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const commonApiDeleteMock = commonApiDelete as jest.MockedFunction<
  typeof commonApiDelete
>;
const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;
const commonApiPostMock = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
>;

describe("waves-v2-api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches subwaves with created-time sort and maps parent metadata", async () => {
    commonApiFetchMock.mockResolvedValue({
      page: 2,
      next: false,
      data: [
        {
          id: "child-wave",
          name: "Child Wave",
          created_at: 123,
          has_competition: false,
          pfp: null,
          contributors: [],
          is_dm_wave: false,
          parent_wave: { id: "api-parent" },
          has_subwaves: true,
          description_drop: {
            contents: null,
            media: [],
          },
          total_drops_count: 3,
          is_private: false,
          last_drop_time: 456,
          context_profile_context: {
            first_unread_drop_serial_no: 7,
            unread_drops: 2,
            pinned: false,
            muted: false,
            subscribed: true,
          },
        },
      ],
    });

    const result = await fetchWaveSubwavesPage({
      parentWaveId: "parent-wave",
      page: 2,
      pageSize: 100,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "waves/parent-wave/subwaves",
      params: {
        page: "2",
        page_size: "100",
        sort: ApiSubwavesSort.CreatedAt,
      },
    });
    expect(result).toMatchObject({
      page: 2,
      next: false,
      waves: [
        {
          id: "child-wave",
          createdAt: 123,
          parentWaveId: "parent-wave",
          hasSubwaves: false,
          unreadDropsCount: 2,
          firstUnreadDropSerialNo: 7,
          subscribed: true,
        },
      ],
    });
  });

  it("fetches wave metadata", async () => {
    commonApiFetchMock.mockResolvedValue([]);

    await expect(fetchWaveMetadata({ waveId: "wave-1" })).resolves.toEqual([]);

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata",
      headers: undefined,
    });
  });

  it("creates wave metadata", async () => {
    const response = { id: 1, data_key: "key", data_value: "value" };
    const body = { data_key: "key", data_value: "value" };
    commonApiPostMock.mockResolvedValue(response);

    await expect(
      createWaveMetadata({ waveId: "wave-1", body })
    ).resolves.toEqual(response);

    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata",
      body,
      headers: undefined,
    });
  });

  it("deletes wave metadata", async () => {
    commonApiDeleteMock.mockResolvedValue(undefined);

    await expect(
      deleteWaveMetadata({ waveId: "wave-1", metadataId: 7 })
    ).resolves.toBeUndefined();

    expect(commonApiDeleteMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata/7",
      headers: undefined,
    });
  });
});
