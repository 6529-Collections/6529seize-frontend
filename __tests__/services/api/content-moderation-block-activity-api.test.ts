import { commonApiFetch } from "@/services/api/common-api";
import {
  fetchContentModerationBlockActivity,
  fetchMyContentModerationReports,
} from "@/services/api/content-moderation-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

it("requests both block and unblock events on initial and cursor pages", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue([]);
  await fetchContentModerationBlockActivity();
  await fetchContentModerationBlockActivity({ limit: 25, before: "500.100" });
  expect(commonApiFetch).toHaveBeenNthCalledWith(1, {
    endpoint: "content-moderation/block-activity",
    params: { limit: "50", include_unblocks: "true" },
    cache: "no-store",
    errorMode: "structured",
  });
  expect(commonApiFetch).toHaveBeenNthCalledWith(2, {
    endpoint: "content-moderation/block-activity",
    params: { limit: "25", before: "500.100", include_unblocks: "true" },
    cache: "no-store",
    errorMode: "structured",
  });
});

it("forwards personal report cancellation and prevents HTTP caching", async () => {
  const controller = new AbortController();
  jest.mocked(commonApiFetch).mockResolvedValue([]);
  await fetchMyContentModerationReports({
    before: "cursor",
    signal: controller.signal,
  });
  expect(commonApiFetch).toHaveBeenLastCalledWith({
    endpoint: "content-moderation/reports/mine",
    params: { limit: "50", before: "cursor" },
    signal: controller.signal,
    cache: "no-store",
    errorMode: "structured",
  });
});
