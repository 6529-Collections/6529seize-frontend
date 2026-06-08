import { ApiSubwavesSort } from "@/generated/models/ApiSubwavesSort";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchWaveSubwavesPage } from "@/services/api/waves-v2-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

describe("fetchWaveSubwavesPage", () => {
  beforeEach(() => {
    commonApiFetchMock.mockReset();
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
});
