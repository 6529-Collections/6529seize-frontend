import { fetchDropCompetitionContext } from "@/services/api/competitions-api";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiPatch: jest.fn(),
  commonApiPut: jest.fn(),
}));

it("paces real transport calls, cancels queued work and preserves parent validation", async () => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
  const legacy = { competition: null, entry: null };
  const native = {
    competition: { id: "competition", wave_id: "wave/one" },
    entry: {
      wave_id: "wave/one",
      drop_id: "drop/three",
      competition_id: "competition",
    },
  };
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce(legacy)
    .mockResolvedValueOnce(native)
    .mockResolvedValueOnce({
      ...native,
      competition: { ...native.competition, wave_id: "wrong-parent" },
    });
  try {
    const controller = new AbortController();
    const first = fetchDropCompetitionContext("wave/one", "drop/one");
    const cancelled = fetchDropCompetitionContext(
      "wave/one",
      "drop/two",
      controller.signal
    );
    const rejection = expect(cancelled).rejects.toMatchObject({
      name: "AbortError",
    });
    const thirdSignal = new AbortController().signal;
    const third = fetchDropCompetitionContext(
      "wave/one",
      "drop/three",
      thirdSignal
    );

    controller.abort();
    await rejection;
    await expect(first).resolves.toEqual(legacy);
    expect(commonApiFetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(250);
    await expect(third).resolves.toEqual(native);
    expect(commonApiFetch).toHaveBeenLastCalledWith({
      endpoint: "v3/waves/wave%2Fone/drops/drop%2Fthree/competition-context",
      signal: thirdSignal,
      errorMode: "structured",
    });

    const wrongParent = fetchDropCompetitionContext("wave/one", "drop/three");
    const invalid = expect(wrongParent).rejects.toThrow(
      "Invalid drop competition context"
    );
    await jest.advanceTimersByTimeAsync(250);
    await invalid;
    expect(commonApiFetch).toHaveBeenCalledTimes(3);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});
