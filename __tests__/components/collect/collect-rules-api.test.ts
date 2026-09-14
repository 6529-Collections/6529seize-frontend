import {
  createCollectRule,
  prepareCollectRule,
} from "@/services/api/collect-rules-api";
import type { ApiCollectRuleDefinition } from "@/generated/models/ApiCollectRuleDefinition";
import type { ApiCollectRulePrepare } from "@/generated/models/ApiCollectRulePrepare";
import { commonApiPost } from "@/services/api/common-api";
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiFetch: jest.fn(),
}));
const mockPost = jest.mocked(commonApiPost);
beforeEach(() => jest.clearAllMocks());
it("sends the caller's stable Idempotency-Key for rule creation and retries", async () => {
  const key = "d9ae3ffc-6cff-4a29-b997-7908c632c121";
  const body = { profile_id: "profile" } as ApiCollectRuleDefinition;
  await createCollectRule(body, key);
  await createCollectRule(body, key);
  expect(mockPost).toHaveBeenCalledTimes(2);
  for (const [request] of mockPost.mock.calls)
    expect(request).toMatchObject({
      endpoint: "collect/rules",
      body,
      headers: { "Idempotency-Key": key },
    });
});
it("keeps rule purchase preparation idempotent independently of rule creation", async () => {
  const body = { expected_revision: 2 } as ApiCollectRulePrepare;
  await prepareCollectRule("rule-id", body, "next-action-key");
  expect(mockPost).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: "collect/rules/rule-id/prepare",
      body,
      headers: { "Idempotency-Key": "next-action-key" },
    })
  );
});
