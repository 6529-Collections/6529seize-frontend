import {
  fetchRecordAnchor,
  resetRecordAnchorForTests,
} from "@/lib/signed-records/record-anchor";

const mockFetch = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (input: unknown) => mockFetch(input),
}));

const ANSWER = {
  anchor: 1200,
  head_height: 1203,
  finalized_time: 1_764_000_000_000,
  max_anchor_lag: 120,
};

beforeEach(() => {
  mockFetch.mockReset();
  resetRecordAnchorForTests();
});

describe("fetchRecordAnchor", () => {
  it("returns the finalized height from the API, unauthenticated", async () => {
    mockFetch.mockResolvedValue(ANSWER);
    await expect(fetchRecordAnchor(1_000)).resolves.toEqual({
      anchor: 1200,
      finalizedTime: 1_764_000_000_000,
      maxAnchorLag: 120,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "signed-records/anchor",
        includeWalletAuth: false,
        cache: "no-store",
      })
    );
  });

  it("asks once for a burst of writes and again after a minute", async () => {
    mockFetch.mockResolvedValue(ANSWER);
    await Promise.all([fetchRecordAnchor(1_000), fetchRecordAnchor(1_000)]);
    await fetchRecordAnchor(50_000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    mockFetch.mockResolvedValue({ ...ANSWER, anchor: 1205 });
    await expect(fetchRecordAnchor(61_000)).resolves.toMatchObject({
      anchor: 1205,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("asks again at once when told to, and keeps the fresh answer", async () => {
    mockFetch.mockResolvedValueOnce(ANSWER);
    await fetchRecordAnchor(1_000);
    mockFetch.mockResolvedValueOnce({ ...ANSWER, anchor: 1201 });
    await expect(
      fetchRecordAnchor(2_000, { fresh: true })
    ).resolves.toMatchObject({ anchor: 1201 });
    await expect(fetchRecordAnchor(3_000)).resolves.toMatchObject({
      anchor: 1201,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("keeps the higher anchor when an older request finishes after a fresh one", async () => {
    let answerOlder: (value: typeof ANSWER) => void = () => undefined;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        answerOlder = resolve;
      })
    );
    const older = fetchRecordAnchor(1_000);
    mockFetch.mockResolvedValueOnce({ ...ANSWER, anchor: 1201 });
    await expect(
      fetchRecordAnchor(2_000, { fresh: true })
    ).resolves.toMatchObject({ anchor: 1201 });
    answerOlder(ANSWER);
    await expect(older).resolves.toMatchObject({ anchor: 1200 });
    await expect(fetchRecordAnchor(3_000)).resolves.toMatchObject({
      anchor: 1201,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("fails rather than sign without a height, and asks again next time", async () => {
    mockFetch.mockRejectedValueOnce(new Error("503"));
    await expect(fetchRecordAnchor(1_000)).rejects.toThrow("503");
    mockFetch.mockResolvedValueOnce({ ...ANSWER, anchor: 0 });
    await expect(fetchRecordAnchor(1_000)).rejects.toThrow(
      "without a finalized anchor height"
    );
    mockFetch.mockResolvedValueOnce(ANSWER);
    await expect(fetchRecordAnchor(1_000)).resolves.toMatchObject({
      anchor: 1200,
    });
  });
});
