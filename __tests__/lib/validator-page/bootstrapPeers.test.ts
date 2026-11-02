/** @jest-environment node */
import type { BucketObject } from "@/lib/validator-page/releasesBucket";

const mockRead = jest.fn<Promise<BucketObject>, [string]>();

jest.mock("@/lib/validator-page/releasesBucket", () => ({
  readReleaseObject: (key: string) => mockRead(key),
}));

import {
  fillBootstrapPeers,
  resetBootstrapPeersCacheForTests,
} from "@/lib/validator-page/bootstrapPeers";

// Made-up addresses in the documentation ranges.
const PEER_1 = `12D3KooWTestPeerA${"1".repeat(33)}`;
const PEER_2 = `12D3KooWTestPeerB${"2".repeat(33)}`;
const ADDRESSES = {
  sentries: [
    {
      peer_id: PEER_1,
      tcp: `/ip4/192.0.2.10/tcp/4001/p2p/${PEER_1}`,
      quic: `/ip4/192.0.2.10/udp/4001/quic-v1/p2p/${PEER_1}`,
      onion: `/onion3/${"a".repeat(56)}:6529/p2p/${PEER_1}`,
    },
    {
      peer_id: PEER_2,
      tcp: `/ip4/198.51.100.20/tcp/4001/p2p/${PEER_2}`,
      quic: "not an address",
    },
  ],
};

function stored(value: unknown): BucketObject {
  return {
    state: "found",
    body: new TextEncoder().encode(JSON.stringify(value)),
    etag: null,
    lastModified: null,
  };
}

describe("fillBootstrapPeers", () => {
  beforeEach(() => {
    resetBootstrapPeersCacheForTests();
    mockRead.mockReset();
  });

  it("puts each sentry's addresses into the guide's tokens", async () => {
    mockRead.mockResolvedValue(stored(ADDRESSES));
    const { markdown, complete } = await fillBootstrapPeers(
      "add {{SENTRY_1_TCP}} and {{SENTRY_2_TCP}}; id {{SENTRY_1_PEER_ID}}"
    );
    expect(complete).toBe(true);
    expect(markdown).toBe(
      `add /ip4/192.0.2.10/tcp/4001/p2p/${PEER_1} and /ip4/198.51.100.20/tcp/4001/p2p/${PEER_2}; id ${PEER_1}`
    );
    expect(mockRead).toHaveBeenCalledWith("content/bootstrap-peers.json");
  });

  it("shows a placeholder for an address it does not have or cannot trust", async () => {
    mockRead.mockResolvedValue(stored(ADDRESSES));
    const { markdown, complete } = await fillBootstrapPeers(
      "{{SENTRY_2_QUIC}} {{SENTRY_2_PEER_ID}}"
    );
    expect(complete).toBe(false);
    expect(markdown).toBe(`<sentry-2 quic address> ${PEER_2}`);
  });

  it("says the guide is incomplete when the file is missing", async () => {
    mockRead.mockResolvedValue({ state: "missing" });
    const { markdown, complete } = await fillBootstrapPeers("{{SENTRY_1_TCP}}");
    expect(complete).toBe(false);
    expect(markdown).toBe("<sentry-1 tcp address>");
  });
});
