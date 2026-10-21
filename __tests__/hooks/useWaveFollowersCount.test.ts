import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import {
  useWaveFollowersCount,
  getWaveFollowersCountQueryKey,
} from "@/hooks/useWaveFollowersCount";

jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

it.each([0, 7])(
  "uses the existing endpoint's current eligible count (%s) with minimal page size",
  async (count) => {
    jest
      .mocked(commonApiFetch)
      .mockResolvedValue({ count, data: [], page: 1, next: false });
    renderHook(() => useWaveFollowersCount("wave"));
    const options = jest.mocked(useQuery).mock.calls.at(-1)![0];
    expect(options.queryKey).toEqual(getWaveFollowersCountQueryKey("wave"));
    const controller = new AbortController();
    const queryFn = options.queryFn as (context: {
      signal: AbortSignal;
    }) => Promise<number>;
    await expect(queryFn({ signal: controller.signal })).resolves.toBe(count);
    expect(commonApiFetch).toHaveBeenLastCalledWith({
      endpoint: "/identity-subscriptions/incoming/WAVE/wave",
      params: { page_size: "1" },
      signal: controller.signal,
    });
  }
);

it("uses separate cache entries for different waves", () => {
  expect(getWaveFollowersCountQueryKey("first")).not.toEqual(
    getWaveFollowersCountQueryKey("second")
  );
});
