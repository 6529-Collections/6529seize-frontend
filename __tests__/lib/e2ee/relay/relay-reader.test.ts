/**
 * @jest-environment node
 */
import { encodeAbiParameters, keccak256, stringToBytes } from "viem";
import { decodeRecordContent } from "@/lib/e2ee/relay/record-content";
import { E2eeRelayReader } from "@/lib/e2ee/relay/relay-reader";
import {
  contentRefOf,
  isOrdererRecord,
  relayAuthDigest,
} from "@/lib/e2ee/relay/relay-records";
import { fakeRelay, RELAY_VECTORS, TEST_AUTH } from "./relay-test-utils";

const T0 = 1_795_000_000_000;

function reader(relay = fakeRelay()) {
  return new E2eeRelayReader({
    urls: ["wss://relay.test"],
    net: RELAY_VECTORS.net,
    ordererKey: RELAY_VECTORS.orderer_key,
    auth: async () => TEST_AUTH,
    open: relay.open,
    now: () => T0 + 60_000,
  });
}

const bytes = (length: number, value: number) =>
  Buffer.alloc(length, value).toString("base64");

describe("relay records written by the backend", () => {
  it("verifies every record against the pinned orderer key", async () => {
    for (const item of RELAY_VECTORS.items) {
      await expect(
        isOrdererRecord(item.event, RELAY_VECTORS.orderer_key)
      ).resolves.toBe(true);
    }
  });

  it("refuses an altered record or another key", async () => {
    const [item] = RELAY_VECTORS.items;
    await expect(
      isOrdererRecord(
        { ...item!.event, seq: item!.event.seq + 1 },
        RELAY_VECTORS.orderer_key
      )
    ).resolves.toBe(false);
    await expect(
      isOrdererRecord(item!.event, `0x${"0b".repeat(32)}`)
    ).resolves.toBe(false);
    await expect(
      isOrdererRecord(
        { ...item!.event, body: item!.event.body!.replace("1", "2") },
        RELAY_VECTORS.orderer_key
      )
    ).resolves.toBe(false);
  });

  it("decodes the first group record's rows", () => {
    const genesis = RELAY_VECTORS.items.find(
      (item) => item.event.wave === `cv/${RELAY_VECTORS.group}`
    )!;
    const ref = contentRefOf(genesis.event)!;
    const content = decodeRecordContent(ref.inline!);
    expect(content).toMatchObject({ type: "genesis", pos: 1, prev: null });
    expect(content.ops.map((op) => op.table)).toEqual([
      "e2ee_groups",
      "e2ee_group_epochs",
      "e2ee_group_roster",
    ]);
  });

  it("computes the relay AUTH digest as P28's tagged hash", () => {
    const input = {
      net: "6529-interim-test",
      relayId: "relay-test",
      nonce: `0x${"07".repeat(32)}`,
      grantId: `0x${"e0".repeat(32)}`,
    };
    const expected = keccak256(
      encodeAbiParameters(
        [
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
        ],
        [
          keccak256(stringToBytes("6529.RelayAuth.v1")),
          keccak256(stringToBytes(input.net)),
          keccak256(stringToBytes(input.relayId)),
          input.nonce as `0x${string}`,
          input.grantId as `0x${string}`,
        ]
      )
    );
    expect(relayAuthDigest(input)).toBe(expected);
  });
});

describe("E2eeRelayReader", () => {
  it("reads a device's pending Welcomes as the REST route returns them", async () => {
    await expect(reader().welcomes(RELAY_VECTORS.device)).resolves.toEqual([
      {
        id: `0x${"a2".repeat(16)}`,
        group: RELAY_VECTORS.group,
        epoch: 1,
        data: bytes(600, 7),
        ratchet_tree: bytes(200, 8),
        added_by_profile_id: "pb",
        added_by_device_key: RELAY_VECTORS.other,
        created_at: T0 + 11,
      },
    ]);
  });

  it("pages a group's log inside the device's windows", async () => {
    const relay = reader();
    const creator = await relay.log({
      group: RELAY_VECTORS.group,
      deviceKey: RELAY_VECTORS.device,
      afterSeq: 0,
      limit: 2,
      lastSeq: 3,
    });
    expect(creator.items.map((item) => item.seq)).toEqual([1, 2]);
    expect(creator.next_after_seq).toBe(2);
    expect(creator.items[0]).toMatchObject({
      type: "entry",
      kind: "commit",
      epoch: 0,
      data: bytes(2048, 1),
      roster_add: [RELAY_VECTORS.other],
      roster_remove: [],
      epoch_fp: null,
    });
    expect(creator.items[1]).toMatchObject({
      type: "message",
      kind: null,
      data: bytes(512, 2),
      epoch_fp: "0102030405060708",
    });
    const joiner = await relay.log({
      group: RELAY_VECTORS.group,
      deviceKey: RELAY_VECTORS.other,
      afterSeq: 0,
      limit: 100,
      lastSeq: 3,
    });
    expect(joiner.items.map((item) => item.seq)).toEqual([2, 3]);
    expect(joiner.next_after_seq).toBeNull();
  });

  it("refuses a log page the relays have not caught up with", async () => {
    await expect(
      reader().log({
        group: RELAY_VECTORS.group,
        deviceKey: RELAY_VECTORS.device,
        afterSeq: 0,
        limit: 100,
        lastSeq: 4,
      })
    ).rejects.toThrow("behind");
  });

  it("reads the latest upload of each attachment chunk", async () => {
    const relay = reader();
    await expect(relay.blobChunk(RELAY_VECTORS.blob, 1)).resolves.toBe(
      bytes(1000, 2)
    );
    await expect(relay.blobChunk(RELAY_VECTORS.blob, 0)).resolves.toBe(
      bytes(70_000, 1)
    );
  });

  it("refuses a stream with a record that is not the orderer's", async () => {
    const relay = fakeRelay(
      RELAY_VECTORS.items.map((item, index) =>
        index === 1
          ? {
              ...item,
              event: { ...item.event, signature: `0x${"00".repeat(64)}` },
            }
          : item
      )
    );
    await expect(
      reader(relay).log({
        group: RELAY_VECTORS.group,
        deviceKey: RELAY_VECTORS.device,
        afterSeq: 0,
        limit: 100,
        lastSeq: 3,
      })
    ).rejects.toThrow("not the orderer's");
  });

  it("refuses a stream with a gap in its hash chain", async () => {
    const wave = `cv/${RELAY_VECTORS.group}`;
    const second = RELAY_VECTORS.items.filter(
      (item) => item.event.wave === wave
    )[1]!;
    const relay = fakeRelay(
      RELAY_VECTORS.items.filter((item) => item !== second)
    );
    await expect(
      reader(relay).log({
        group: RELAY_VECTORS.group,
        deviceKey: RELAY_VECTORS.device,
        afterSeq: 0,
        limit: 100,
        lastSeq: 3,
      })
    ).rejects.toThrow("hash chain");
  });

  it("reads a stream onward from its last page", async () => {
    const relay = fakeRelay();
    const cached = reader(relay);
    await cached.welcomes(RELAY_VECTORS.device);
    await cached.welcomes(RELAY_VECTORS.device);
    expect(relay.requests["HELLO"]).toBe(1);
    expect(relay.requests["HIST"]).toBe(2);
  });
});
