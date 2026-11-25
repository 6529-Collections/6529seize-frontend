import type { Hex } from "viem";
import { chainGatewayGet } from "@/lib/chain-identity/gateway";
import { wavesGateway } from "@/lib/chain-waves/gateway";

jest.mock("@/lib/chain-identity/gateway", () => ({
  ...jest.requireActual("@/lib/chain-identity/gateway"),
  chainGatewayGet: jest.fn(),
}));

const get = chainGatewayGet as jest.Mock;
const POLL: Hex = `0x${"0b".repeat(32)}`;
const CID: Hex = `0x${"00".repeat(31)}10`;

describe("wavesGateway.findPollBallot", () => {
  beforeEach(() => get.mockReset());

  it("reads the cluster's ballot by its key, however many ballots the poll has", async () => {
    get.mockResolvedValue([
      { cid: CID, selection: 1, choices: [0], version: 4 },
    ]);
    await expect(wavesGateway.findPollBallot(POLL, CID)).resolves.toEqual({
      cid: CID,
      selection: 1,
      choices: [0],
      version: 4,
    });
    // PollBallot[(pollId, cid)]: family 0x060c, the poll id, then one below
    // the cid, so the next key is the cluster's own.
    expect(get).toHaveBeenCalledWith(`/v1/polls/${POLL}/ballots`, {
      signal: undefined,
      query: {
        at: "head",
        limit: 1,
        after: `0x060c${"0b".repeat(32)}${"00".repeat(31)}0f`,
      },
    });
  });

  it("is null when the next ballot is another cluster's", async () => {
    get.mockResolvedValue([
      { cid: `0x${"00".repeat(31)}11`, selection: 1, choices: [0], version: 1 },
    ]);
    await expect(wavesGateway.findPollBallot(POLL, CID)).resolves.toBeNull();
  });

  it("is null when the poll has no ballot from there on", async () => {
    get.mockResolvedValue([]);
    await expect(wavesGateway.findPollBallot(POLL, CID)).resolves.toBeNull();
  });
});
