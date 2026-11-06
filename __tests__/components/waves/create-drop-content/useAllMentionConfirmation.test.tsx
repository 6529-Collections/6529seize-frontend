import { act, renderHook, waitFor } from "@testing-library/react";
import { useAllMentionConfirmation } from "@/components/waves/create-drop-content/useAllMentionConfirmation";
import type { DropMutationBody } from "@/components/waves/create-drop-content/drop-submission.types";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
const fetchCount = jest.mocked(commonApiFetch);
const request: DropMutationBody = {
  dropId: "temp-optimistic",
  drop: {
    wave_id: "wave",
    drop_type: ApiDropType.Chat,
    parts: [{ content: "hello @all", media: [], quoted_drop: null }],
    mentioned_groups: [ApiDropGroupMention.All],
    mentioned_users: [],
    mentioned_waves: [],
    metadata: [],
    signature: null,
    referenced_nfts: [],
  },
};

function setup() {
  const submitDrop = jest.fn().mockReturnValue(true);
  const hook = renderHook(
    ({ profileId }) =>
      useAllMentionConfirmation({
        submitDrop,
        waveId: "wave",
        profileId,
      }),
    { initialProps: { profileId: "author" } }
  );
  return { ...hook, submitDrop };
}

beforeEach(() => {
  fetchCount.mockReset();
  fetchCount.mockResolvedValue({ count: 1234 });
});

it("waits for explicit confirmation and shares duplicate submissions", async () => {
  const { result, submitDrop } = setup();
  let first!: boolean | Promise<boolean>;
  act(() => {
    first = result.current.submitDrop(request);
  });
  expect(result.current.submitDrop(request)).toBe(first);
  await waitFor(() =>
    expect(result.current.confirmation).toEqual({
      status: "ready",
      count: 1234,
    })
  );
  expect(submitDrop).not.toHaveBeenCalled();
  act(() => result.current.confirm());
  await expect(first).resolves.toBe(true);
  expect(submitDrop).toHaveBeenCalledTimes(1);
  expect(submitDrop).toHaveBeenCalledWith(request);
});

it("cancels without submitting and recounts the next attempt", async () => {
  const { result, submitDrop } = setup();
  let submission!: boolean | Promise<boolean>;
  act(() => {
    submission = result.current.submitDrop(request);
  });
  act(() => result.current.cancel());
  await expect(submission).resolves.toBe(false);
  expect(submitDrop).not.toHaveBeenCalled();
  act(() => {
    submission = result.current.submitDrop(request);
  });
  await waitFor(() =>
    expect(result.current.confirmation?.status).toBe("ready")
  );
  expect(fetchCount).toHaveBeenCalledTimes(2);
  act(() => result.current.cancel());
  await expect(submission).resolves.toBe(false);
});

it("fails closed and supports retry, including a zero audience", async () => {
  fetchCount
    .mockRejectedValueOnce(new Error("unavailable"))
    .mockResolvedValueOnce({ count: 0 });
  const { result, submitDrop } = setup();
  let submission!: boolean | Promise<boolean>;
  act(() => {
    submission = result.current.submitDrop(request);
  });
  await waitFor(() =>
    expect(result.current.confirmation?.status).toBe("error")
  );
  act(() => result.current.confirm());
  expect(submitDrop).not.toHaveBeenCalled();
  act(() => result.current.retry());
  await waitFor(() =>
    expect(result.current.confirmation).toEqual({ status: "ready", count: 0 })
  );
  act(() => result.current.confirm());
  await expect(submission).resolves.toBe(true);
});

it.each([-1, NaN, 1.5])("rejects an invalid count %s", async (count) => {
  fetchCount.mockResolvedValue({ count });
  const { result, submitDrop } = setup();
  act(() => {
    void result.current.submitDrop(request);
  });
  await waitFor(() =>
    expect(result.current.confirmation?.status).toBe("error")
  );
  expect(submitDrop).not.toHaveBeenCalled();
});

it("cancels when the acting profile changes or the composer unmounts", async () => {
  const { result, submitDrop, rerender, unmount } = setup();
  let submission!: boolean | Promise<boolean>;
  act(() => {
    submission = result.current.submitDrop(request);
  });
  rerender({ profileId: "other" });
  await expect(submission).resolves.toBe(false);
  expect(result.current.confirmation).toBeNull();
  act(() => {
    submission = result.current.submitDrop(request);
  });
  unmount();
  await expect(submission).resolves.toBe(false);
  expect(submitDrop).not.toHaveBeenCalled();
});

it("leaves messages without an active all mention on the existing path", () => {
  const { result, submitDrop } = setup();
  expect(
    result.current.submitDrop({
      ...request,
      drop: { ...request.drop, mentioned_groups: [] },
    })
  ).toBe(true);
  expect(submitDrop).toHaveBeenCalledTimes(1);
  expect(fetchCount).not.toHaveBeenCalled();
});
