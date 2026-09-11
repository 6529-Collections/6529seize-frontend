import { commonApiFetch } from "@/services/api/common-api";
import { fetchContentModerationBlockActivity } from "@/services/api/content-moderation-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

it("requests both block and unblock events on initial and cursor pages", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue([]);
  await fetchContentModerationBlockActivity();
  await fetchContentModerationBlockActivity({ limit: 25, before: "500.100" });
  expect(commonApiFetch).toHaveBeenNthCalledWith(1, {
    endpoint: "content-moderation/block-activity",
    params: { limit: "50", include_unblocks: "true" },
    errorMode: "structured",
  });
  expect(commonApiFetch).toHaveBeenNthCalledWith(2, {
    endpoint: "content-moderation/block-activity",
    params: { limit: "25", before: "500.100", include_unblocks: "true" },
    errorMode: "structured",
  });
});
