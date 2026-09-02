import { QueryClient } from "@tanstack/react-query";
import { invalidateContentModerationPresentation } from "@/services/content-moderation/content-moderation-query";

describe("content moderation query invalidation", () => {
  it("attempts every presentation invalidation when one rejects", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValue(undefined);

    await expect(
      invalidateContentModerationPresentation(queryClient)
    ).resolves.toBeUndefined();

    expect(invalidateSpy).toHaveBeenCalledTimes(9);
  });
});
