import { ApiSubwavesSort } from "@/generated/models/ApiSubwavesSort";
import { fetchWaveSubwavesPage } from "@/services/api/waves-v2-api";
import { fetchAllWaveSubwaves } from "@/hooks/useWaveSubwaves";
import type { SidebarWave } from "@/types/waves.types";

jest.mock("@/services/api/waves-v2-api", () => ({
  fetchWaveSubwavesPage: jest.fn(),
}));

const fetchWaveSubwavesPageMock =
  fetchWaveSubwavesPage as jest.MockedFunction<typeof fetchWaveSubwavesPage>;

const createSubwave = (id: string) => ({ id }) as SidebarWave;

describe("fetchAllWaveSubwaves", () => {
  beforeEach(() => {
    fetchWaveSubwavesPageMock.mockReset();
  });

  it("loads every subwave page until the endpoint reports no next page", async () => {
    fetchWaveSubwavesPageMock
      .mockResolvedValueOnce({
        waves: [createSubwave("child-1")],
        page: 1,
        next: true,
      })
      .mockResolvedValueOnce({
        waves: [createSubwave("child-2")],
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
    expect(subwaves.map((wave) => wave.id)).toEqual(["child-1", "child-2"]);
  });

  it("stops after the first page when there is no next page", async () => {
    fetchWaveSubwavesPageMock.mockResolvedValueOnce({
      waves: [createSubwave("child-1")],
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
