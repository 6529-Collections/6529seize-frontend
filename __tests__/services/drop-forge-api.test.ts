import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { beginForgeManual, forgeList } from "@/services/api/drop-forge-api";
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));
it("downloads only saved, read-only pages without starting preparation again", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValueOnce({
      rows: [{ wallet: "a", amount: 1 }],
      next_offset: 1000,
    })
    .mockResolvedValueOnce({
      rows: [{ wallet: "b", amount: 2 }],
      next_offset: null,
    });
  expect(await forgeList("job", "p0", "allowlists")).toEqual([
    { wallet: "a", amount: 1 },
    { wallet: "b", amount: 2 },
  ]);
  expect(commonApiFetch).toHaveBeenNthCalledWith(2, {
    endpoint: "drop-forge/distribution-jobs/job/lists/p0/allowlists",
    params: { offset: "1000" },
  });
  expect(commonApiPost).not.toHaveBeenCalled();
});

it("declares the subscription phase for wallets that appear in multiple lists", async () => {
  await beginForgeManual("creator", 123, "PHASE1_AIRDROP");
  expect(commonApiPost).toHaveBeenLastCalledWith({
    endpoint: "drop-forge/launches/creator/123/manual",
    body: { operation: "BEGIN", action: "PHASE1_AIRDROP" },
  });
});

it.each([
  ["phase0", "PHASE0_AIRDROP"],
  ["phase1", "PHASE1_AIRDROP"],
  ["phase2", "PHASE2_AIRDROP"],
  ["publicphase", "PUBLIC_PHASE_AIRDROP"],
])(
  "maps the actual subscription section category %s",
  async (label, action) => {
    await beginForgeManual("creator", 123, label);
    expect(commonApiPost).toHaveBeenLastCalledWith({
      endpoint: "drop-forge/launches/creator/123/manual",
      body: { operation: "BEGIN", action },
    });
  }
);
it("rejects a first page that does not advance its offset", async () => {
  jest.mocked(commonApiFetch).mockResolvedValue({ rows: [], next_offset: 0 });
  await expect(forgeList("job", "p0", "allowlists")).rejects.toThrow(
    "pagination"
  );
});
