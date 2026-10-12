import { waitFor } from "@testing-library/react";
import { createReplyCountReconciliation } from "@/components/waves/drops/reply-threads/reply-count-reconciliation";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";

const drop = (id: string, count?: number, parent?: string): ApiDropV2View =>
  ({
    id,
    wave: { id: "wave" },
    replies_count: count,
    ...(parent === undefined ? {} : { reply_to: { drop_id: parent } }),
  }) as ApiDropV2View;

function setup(fetchDrop = jest.fn<Promise<ApiDropV2View>, [string]>()) {
  const applyCount = jest.fn();
  const onError = jest.fn();
  const reconciliation = createReplyCountReconciliation({
    waveId: "wave",
    fetchDrop,
    applyCount,
    onError,
  });
  return { reconciliation, fetchDrop, applyCount, onError };
}

describe("reply count reconciliation", () => {
  it("refreshes every ancestor of a deeply nested reply", async () => {
    const state = setup();
    state.fetchDrop
      .mockResolvedValueOnce(drop("reply-2", 1, "reply-1"))
      .mockResolvedValueOnce(drop("reply-1", 2, "root"))
      .mockResolvedValueOnce(drop("root", 3));
    state.reconciliation.request("reply-2");
    await waitFor(() =>
      expect(state.applyCount).toHaveBeenCalledWith("root", 3)
    );
    expect(state.applyCount.mock.calls).toEqual([
      ["reply-2", 1],
      ["reply-1", 2],
      ["root", 3],
    ]);
  });

  it("reruns a pending refresh when another reply arrives during the fetch", async () => {
    let resolveFirst!: (value: ApiDropV2View) => void;
    const state = setup();
    state.fetchDrop
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValue(drop("root", 3));
    state.reconciliation.request("root");
    state.reconciliation.request("root");
    state.reconciliation.request("root");
    expect(state.fetchDrop).toHaveBeenCalledTimes(1);
    resolveFirst(drop("root", 2));
    await waitFor(() =>
      expect(state.applyCount).toHaveBeenLastCalledWith("root", 3)
    );
    expect(state.fetchDrop).toHaveBeenCalledTimes(2);
  });

  it("treats an omitted server count as zero", async () => {
    const state = setup();
    state.fetchDrop.mockResolvedValue(drop("root"));
    state.reconciliation.request("root");
    await waitFor(() =>
      expect(state.applyCount).toHaveBeenCalledWith("root", 0)
    );
  });

  it("does not apply late results after disposal", async () => {
    let resolveFetch!: (value: ApiDropV2View) => void;
    const state = setup();
    state.fetchDrop.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );
    state.reconciliation.request("root");
    state.reconciliation.dispose();
    resolveFetch(drop("root", 2));
    // Let the resolved fetch and all of its async continuations finish.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(state.applyCount).not.toHaveBeenCalled();
    state.reconciliation.request("root");
    expect(state.fetchDrop).toHaveBeenCalledTimes(1);
  });

  it.each(["cycle", "other-wave"])(
    "rejects invalid ancestry: %s",
    async (kind) => {
      const state = setup();
      state.fetchDrop.mockResolvedValue(
        kind === "cycle"
          ? drop("root", 1, "root")
          : {
              ...drop("root", 1),
              wave: { ...drop("root").wave, id: "other-wave" },
            }
      );
      state.reconciliation.request("root");
      await waitFor(() => expect(state.onError).toHaveBeenCalled());
      expect(state.applyCount).not.toHaveBeenCalled();
    }
  );

  it("allows another event to retry after a failed fetch", async () => {
    const state = setup();
    state.fetchDrop
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(drop("root", 2));
    state.reconciliation.request("root");
    await waitFor(() => expect(state.onError).toHaveBeenCalled());
    state.reconciliation.request("root");
    await waitFor(() =>
      expect(state.applyCount).toHaveBeenCalledWith("root", 2)
    );
  });
});
