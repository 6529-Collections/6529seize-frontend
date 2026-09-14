import { preflightMarketBatch } from "@/services/api/market-batch-api";
import { commonApiPost } from "../../../services/api/common-api";

jest.unmock("@/services/api/market-batch-api");
jest.mock("../../../services/api/common-api", () => ({ commonApiPost: jest.fn() }));

it("uses the authenticated API wrapper with only the exact revision and transaction digest", async () => {
  const body = {
    expected_revision: "a".repeat(64),
    transaction_digest: "b".repeat(64),
  };
  const result = {
    operation_id: "batch/id",
    revision: body.expected_revision,
    transaction_digest: body.transaction_digest,
    estimated_gas: "500000",
    block_number: 12,
    block_hash: `0x${"c".repeat(64)}`,
    block_timestamp: 1800000000,
  };
  jest.mocked(commonApiPost).mockResolvedValue(result);
  await expect(preflightMarketBatch("batch/id", body)).resolves.toBe(result);
  expect(commonApiPost).toHaveBeenCalledWith({
    endpoint: "market/operations/batch%2Fid/preflight",
    body,
    errorMode: "structured",
  });
});
