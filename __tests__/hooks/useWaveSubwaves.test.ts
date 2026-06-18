import { ApiSubwavesSort } from "@/generated/models/ApiSubwavesSort";
import { fetchWaveSubwavesPage } from "@/services/api/waves-v2-api";
import {
  fetchAllWaveSubwaves,
  getWaveSubwavesQueryKey,
  getWaveSubwavesQueryOptions,
} from "@/hooks/useWaveSubwaves";
import type { SidebarWave } from "@/types/waves.types";

jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWaveSubwavesPage: jest.fn(),
}));

const fetchWaveSubwavesPageMock = fetchWaveSubwavesPage as jest.MockedFunction<
  typeof fetchWaveSubwavesPage
>;

const createSubwave = ({
  id,
  createdAt = 0,
  latestDropTimestamp = null,
  name = id,
}: {
  readonly id: string;
  readonly createdAt?: number | undefined;
  readonly latestDropTimestamp?: number | null | undefined;
  readonly name?: string | undefined;
}) =>
  ({
    id,
    name,
    createdAt,
    latestDropTimestamp,
  }) as SidebarWave;

describe("fetchAllWaveSubwaves", () => {
  beforeEach(() => {
    fetchWaveSubwavesPageMock.mockReset();
  });

  it("loads every page and returns subwaves by latest activity", async () => {
    fetchWaveSubwavesPageMock
      .mockResolvedValueOnce({
        waves: [
          createSubwave({
            id: "child-1",
            latestDropTimestamp: 100,
          }),
        ],
        page: 1,
        next: true,
      })
      .mockResolvedValueOnce({
        waves: [
          createSubwave({
            id: "child-2",
            latestDropTimestamp: 300,
          }),
        ],
        page: 2,
        next: false,
      });

    const subwaves = await fetchAllWaveSubwaves({
      parentWaveId: "parent-wave",
      pageSize: 100,
      sort: ApiSubwavesSort.CreatedAt,
    });

    expect(fetchWaveSubwavesPageMock).toHaveBeenCalledTimes(2);
    expect(fetchWaveSubwavesPageMock).toHaveBeenNthCalledWith(1, {
      parentWaveId: "parent-wave",
      page: 1,
      pageSize: 100,
      sort: ApiSubwavesSort.CreatedAt,
    });
    expect(fetchWaveSubwavesPageMock).toHaveBeenNthCalledWith(2, {
      parentWaveId: "parent-wave",
      page: 2,
      pageSize: 100,
      sort: ApiSubwavesSort.CreatedAt,
    });
    expect(subwaves.map((wave) => wave.id)).toEqual(["child-2", "child-1"]);
  });

  it("falls back to newest created time when subwaves have no drops", async () => {
    fetchWaveSubwavesPageMock.mockResolvedValueOnce({
      waves: [
        createSubwave({
          id: "older-empty-child",
          createdAt: 100,
        }),
        createSubwave({
          id: "newer-empty-child",
          createdAt: 300,
        }),
      ],
      page: 1,
      next: false,
    });

    const subwaves = await fetchAllWaveSubwaves({
      parentWaveId: "parent-wave",
    });

    expect(subwaves.map((wave) => wave.id)).toEqual([
      "newer-empty-child",
      "older-empty-child",
    ]);
  });

  it("stops after the first page when there is no next page", async () => {
    fetchWaveSubwavesPageMock.mockResolvedValueOnce({
      waves: [createSubwave({ id: "child-1" })],
      page: 1,
      next: false,
    });

    const subwaves = await fetchAllWaveSubwaves({
      parentWaveId: "parent-wave",
    });

    expect(fetchWaveSubwavesPageMock).toHaveBeenCalledTimes(1);
    expect(fetchWaveSubwavesPageMock).toHaveBeenCalledWith({
      parentWaveId: "parent-wave",
      page: 1,
      pageSize: 100,
      sort: ApiSubwavesSort.CreatedAt,
    });
    expect(subwaves.map((wave) => wave.id)).toEqual(["child-1"]);
  });
});

describe("subwave query keys", () => {
  it("includes normalized viewer identity when present", () => {
    expect(getWaveSubwavesQueryKey("parent-wave", " 0xABC:Primary ")).toEqual([
      "WAVE_SUBWAVES",
      {
        parent_wave_id: "parent-wave",
        page: 1,
        page_size: 100,
        sort: ApiSubwavesSort.CreatedAt,
        viewer_identity: "0xabc:primary",
      },
    ]);
  });

  it("omits viewer identity when no viewer is available", () => {
    const queryOptions = getWaveSubwavesQueryOptions("parent-wave", null);

    expect(queryOptions.queryKey).toEqual([
      "WAVE_SUBWAVES",
      {
        parent_wave_id: "parent-wave",
        page: 1,
        page_size: 100,
        sort: ApiSubwavesSort.CreatedAt,
      },
    ]);
  });
});
