import type { ApiDropCuration } from "@/generated/models/ApiDropCuration";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  CurationOrderChangedError,
  moveCurationDrop,
  type CurationDropPlacement,
} from "@/services/api/curation-drop-order-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const fetchMock = jest.mocked(commonApiFetch);
const postMock = jest.mocked(commonApiPost);
const membership = (
  priority: number | null,
  overrides: Partial<ApiDropCuration> = {}
): ApiDropCuration => ({
  id: "curation",
  name: "Guides",
  wave_id: "wave",
  group_id: "curators",
  created_at: 0,
  updated_at: 0,
  priority_order: 1,
  drop_included: true,
  authenticated_user_can_curate: true,
  drop_priority_order: priority,
  ...overrides,
});

const move = (placement: CurationDropPlacement) =>
  moveCurationDrop({
    dropId: "source",
    curationId: "curation",
    anchorDropId: "anchor",
    placement,
  });

describe("saving Curation drop order", () => {
  beforeEach(() => jest.resetAllMocks());

  it.each<[number, number, CurationDropPlacement, number]>([
    [1, 5, "before", 5],
    [1, 5, "after", 4],
    [5, 1, "before", 2],
    [5, 1, "after", 1],
    [2, 4, "after", 3],
    [4, 2, "before", 3],
    [1, 205, "before", 205],
  ])(
    "moves rank %i relative to %i (%s) using saved rank %i",
    async (source, anchor, placement, expected) => {
      fetchMock
        .mockResolvedValueOnce([membership(source)])
        .mockResolvedValueOnce([membership(anchor)]);

      await move(placement);

      expect(postMock).toHaveBeenCalledWith({
        endpoint: "drops/source/curations",
        body: { curation_id: "curation", priority_order: expected },
        parseJson: false,
        errorMode: "structured",
      });
    }
  );

  it.each<[number, number, CurationDropPlacement]>([
    [3, 2, "before"],
    [2, 3, "after"],
  ])(
    "skips an unchanged position %i %i %s",
    async (source, anchor, placement) => {
      fetchMock
        .mockResolvedValueOnce([membership(source)])
        .mockResolvedValueOnce([membership(anchor)]);
      await move(placement);
      expect(postMock).not.toHaveBeenCalled();
    }
  );

  it("uses only the selected Curation's ranks", async () => {
    fetchMock
      .mockResolvedValueOnce([
        membership(20, { id: "other-curation" }),
        membership(1),
      ])
      .mockResolvedValueOnce([
        membership(30, { id: "other-curation" }),
        membership(5),
      ]);
    await move("before");
    expect(postMock).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { curation_id: "curation", priority_order: 5 },
      })
    );
  });

  it.each([
    { invalid: [] },
    { invalid: [membership(null)] },
    { invalid: [membership(0)] },
    { invalid: [membership(1.5)] },
    { invalid: [membership(2, { drop_included: false })] },
    { invalid: [membership(2, { authenticated_user_can_curate: false })] },
  ])(
    "does not save with missing membership, permission, or rank: %j",
    async ({ invalid }) => {
      fetchMock
        .mockResolvedValueOnce(invalid)
        .mockResolvedValueOnce([membership(5)]);
      await expect(move("before")).rejects.toBeInstanceOf(
        CurationOrderChangedError
      );
      expect(postMock).not.toHaveBeenCalled();
    }
  );

  it("does not save against a removed anchor", async () => {
    fetchMock.mockResolvedValueOnce([membership(1)]).mockResolvedValueOnce([]);
    await expect(move("before")).rejects.toBeInstanceOf(
      CurationOrderChangedError
    );
    expect(postMock).not.toHaveBeenCalled();
  });

  it("leaves a failed save for the caller to roll back", async () => {
    fetchMock
      .mockResolvedValueOnce([membership(1)])
      .mockResolvedValueOnce([membership(5)]);
    const error = new Error("Could not save");
    postMock.mockRejectedValueOnce(error);
    await expect(move("before")).rejects.toBe(error);
  });
});
