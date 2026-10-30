import { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  invalidateContentModerationPresentation,
  reconcileIdentityFollowingAfterBlockChange,
} from "@/services/content-moderation/content-moderation-query";

describe("content moderation query invalidation", () => {
  it("refreshes scoped follow data without overwriting other accounts after blocking", async () => {
    const client = new QueryClient();
    const legacyKey = [QueryKey.IDENTITY_FOLLOWING_ACTIONS, "artist"];
    const firstViewerKey = [...legacyKey, { identityId: "owner" }];
    const secondViewerKey = [...legacyKey, { identityId: "other" }];
    const actions = { actions: ["DROP_CREATED"] };
    client.setQueryData(legacyKey, actions);
    client.setQueryData(firstViewerKey, actions);
    client.setQueryData(secondViewerKey, actions);
    client.setQueryData([QueryKey.IDENTITY_FOLLOWING, "owner"], { count: 1 });
    await reconcileIdentityFollowingAfterBlockChange(client, "artist");
    expect(client.getQueryData(legacyKey)).toEqual({ actions: [] });
    for (const key of [firstViewerKey, secondViewerKey]) {
      expect(client.getQueryData(key)).toEqual(actions);
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    }
    expect(
      client.getQueryState([QueryKey.IDENTITY_FOLLOWING, "owner"])
        ?.isInvalidated
    ).toBe(true);
  });
  it("attempts every presentation invalidation when one rejects", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValue(undefined);

    await expect(
      invalidateContentModerationPresentation(queryClient)
    ).resolves.toBeUndefined();

    expect(invalidateSpy).toHaveBeenCalledTimes(13);
    for (const queryKey of [
      QueryKey.PROFILE_CIC_STATEMENTS,
      QueryKey.PROFILE,
      QueryKey.GROUP,
      QueryKey.GROUPS,
    ]) {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [queryKey] });
    }
  });
});
