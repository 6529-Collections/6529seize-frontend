/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { keccak256 } from "viem";

import { hexToBytes, randomHex, utf8Encode } from "@/lib/e2ee/bytes";
import {
  aadEntry,
  aadMessage,
  digestBytes,
  entryDigest,
  epochCommitment,
  fp,
  messageDigest,
  revokeDigest,
  rosterDigest,
  safetyCodeFromFp,
  sortDeviceKeys,
  TAG,
} from "@/lib/e2ee/digests";
import {
  loadMlsWasm,
  MLS_WASM_MANIFEST,
  type MlsWasmExports,
} from "@/lib/e2ee/wasm";

// Copied verbatim from the backend's shared vector file (e2ee-digest-vectors.json).
const V = {
  tags: {
    "6529.MlsEntry.v1":
      "0xb9e79460fc01cea6b3f1c6ade1899499dcc2a6206f75b6097630c9df36b7229d",
    "6529.MlsRoster.v1":
      "0xe43921de9eb07f53d934cd02c46d2eeb15d17ddfd176bcf6ce9573edbef24205",
    "6529.MlsDeviceRevoke.v1":
      "0xbacfeaa8a6998868f4d017f41f7f3149f1eb84bc48e829f20433af47c43bcb50",
    "6529.MlsMessageSig.v1":
      "0xcb3fbf90e3f89488c067dcf74257a74993a2fbf7c532505a9d81de235499e1bb",
    "6529.MlsEpoch.v1":
      "0xdd916fd9f3726971e02f1a6a4dd95da100d23de4aa440faf62160e847b745244",
    "6529.MlsWrapE.v1":
      "0xcd2ecd82a43f1b0df3cc88ed7b0b3a3b711411669e70bec0c0e8d98c0faf0cde",
    "6529.MlsWrapM.v1":
      "0x3605ba3e84bbaf7e39a98ceb6d3f950a643a150f3c64192f8b1c714b2cf3f0c5",
  },
  group: "0xa7d73b1e44ece08fbc9aa5f15cabb9c4acf864fa61971dfca0e33ffd6c2b9c69",
  commitKey7:
    "0x6263eee99c33a72f6396ed93718578081d88a476c1f02a5775c5dc6e69465b5d",
  device1: "0x677b3d7b1775509a6eeffa28ef785652291356d3569fbb8a189b54bd0d684a83",
  entryCommit: {
    epoch: 7,
    entry_hash:
      "0x7011a2293052db045ce02a115cb73bbb7991fecb54f392f98bd026d59e0eaf59",
    epoch_commitment:
      "0xb4ea0b40f50b2844ef0318e2fd110722eee1050002ef826eb6cc4157354f35d1",
    next_commit_key:
      "0x8b588022fa1f8d17786cfe6290c7f51af5c422c82510259058d55dd2a944f9ed",
    padded_len: 2048,
    entry_digest:
      "0x14f86a7f94b1b1dbec0835abfcedc8af73f1a213ea0e06e7033995e90c718ead",
    signature:
      "0x87f87617e7b6824913dde3b776a515af00dbf3bd718763a964305842050b81dd8e2af8a1dc09d0b43a20dda9765c759bdfac787dd93d0b3499434a8997ec6c05",
  },
  entryProposal: {
    entry_digest:
      "0x29e75cdb7633efdaf8e223a330d5a89ae95e190fa21fd74f4e254861df727345",
    signature:
      "0x775d2df5e832885fced3ec39c5865b0bb42ffb9a8beb344aac040b1e97fe33095eae238f897f9e7666a51d776af28b5e3da61e4b1be08d2e82a75f42b387b303",
  },
  epochCommitment: {
    epoch: 8,
    group_context_hash:
      "0x860d0d2eaf291541ea965a25600c45877460db88bb8601e4b028d8b9115a119f",
    value: "0xb4ea0b40f50b2844ef0318e2fd110722eee1050002ef826eb6cc4157354f35d1",
  },
  roster: {
    epoch: 7,
    device_keys: [
      "0xa6bc45ee7fd7b06e160cbf062d53b7889bd9f7f7752fe5c3d2f19f06d54154f8",
      "0x3e1f215f9a6942a8bfd6842c2ec6ad78012838698220355ac5f89a38f908b91d",
      "0x677b3d7b1775509a6eeffa28ef785652291356d3569fbb8a189b54bd0d684a83",
    ],
    sorted_device_keys: [
      "0x3e1f215f9a6942a8bfd6842c2ec6ad78012838698220355ac5f89a38f908b91d",
      "0x677b3d7b1775509a6eeffa28ef785652291356d3569fbb8a189b54bd0d684a83",
      "0xa6bc45ee7fd7b06e160cbf062d53b7889bd9f7f7752fe5c3d2f19f06d54154f8",
    ],
    roster_digest:
      "0xbc17535eb615f03502edb5b99a9879c4a3a4f6f392bb219cb7e4f8635ce26bbf",
    signature:
      "0x1afb57d0212fa123c81ac802a91fca1249c453b244f284dbad2db884338d7d375c53d4fe91b08db539f07dcc7370da68c08fa98f2754580b1f4067d9774a9504",
  },
  revoke: {
    target:
      "0xa6bc45ee7fd7b06e160cbf062d53b7889bd9f7f7752fe5c3d2f19f06d54154f8",
    revoker:
      "0x677b3d7b1775509a6eeffa28ef785652291356d3569fbb8a189b54bd0d684a83",
    revoked_at_seconds: 1760270460,
    revoke_digest:
      "0xf63029771ee9a9693d50df890a19408b0f8eee13bc39a77fff0e44eaffbb9156",
    signature:
      "0xe74d85c7ff8337c51bbd1bd18794e2559536450294e248f9e593cb2468fdf080069a752f264dfa402b495171e9dab8ce687e64ef7cf6e865e64296ddd4de3b0b",
  },
  message: {
    epoch: 7,
    body_utf8:
      '{"v":1,"t":"msg","id":"00112233445566778899aabbccddeeff","ts":1760000000000,"text":"hello"}',
    body_hash:
      "0x4b1d9645ff5def1aafc20e2e3c45d5c8c4ff94f80a541dbcbfef996ca6654bdb",
    message_digest:
      "0x30b87c15aa025801f880c14ec71401d26ff201a3101a42275533991ba476531b",
    sig64:
      "0x8e397fbb01a38154e80c22eeab8fb38e697bdc99b5879f8753c5ac8cf1d32d425b409f66d6d2823374d65231c93c6bcb7d8565c7f08c557c8faa773d2e61a90b",
  },
  wrapAad: {
    entry_commit_epoch_7:
      "0x0a99747eb5f4414fbf11bf3788fa1ed2ff8a91d9a835740a23bec81900778566",
    entry_proposal_epoch_7:
      "0xf0f0a42d2df0f11104af8776e8e9c1c6f514f1c56076b9a810133340d25c54e6",
    message_epoch_7:
      "0xa6c8cc3cf8d4cf40143a4e1aa386d88007a5b6ebf504d7ea3ff220c226aa4981",
  },
  fingerprint: { input_utf8: "epoch authenticator 7", fp: "ae6fe11a41a980cb" },
} as const;

const ZERO = `0x${"0".repeat(64)}`;

let wasm: MlsWasmExports;

beforeAll(async () => {
  const bytes = new Uint8Array(
    readFileSync(join(process.cwd(), "public", MLS_WASM_MANIFEST.file))
  );
  wasm = await loadMlsWasm({ bytes });
});

describe("digests vs the backend vectors", () => {
  it("TAG", () => {
    for (const [name, value] of Object.entries(V.tags)) {
      expect(TAG(name)).toBe(value);
    }
  });

  it("entry digest (commit and proposal) and K_n signatures", () => {
    const base = {
      g: V.group,
      epoch: V.entryCommit.epoch,
      entryHash: V.entryCommit.entry_hash,
      paddedLen: V.entryCommit.padded_len,
    };
    const commit = entryDigest({
      ...base,
      kind: "commit",
      epochCommitment: V.entryCommit.epoch_commitment,
      nextCommitKey: V.entryCommit.next_commit_key,
    });
    expect(commit).toBe(V.entryCommit.entry_digest);
    expect(
      wasm.verifyEd25519(
        V.commitKey7,
        digestBytes(commit),
        V.entryCommit.signature
      )
    ).toBe(true);
    const proposal = entryDigest({
      ...base,
      kind: "proposal",
      epochCommitment: ZERO,
      nextCommitKey: ZERO,
    });
    expect(proposal).toBe(V.entryProposal.entry_digest);
    expect(
      wasm.verifyEd25519(
        V.commitKey7,
        digestBytes(proposal),
        V.entryProposal.signature
      )
    ).toBe(true);
  });

  it("entry data hash follows the data rule", () => {
    const data = Uint8Array.from({ length: 2048 }, (_, i) => i % 251);
    expect(keccak256(data)).toBe(V.entryCommit.entry_hash);
  });

  it("epoch commitment", () => {
    expect(
      epochCommitment(
        V.group,
        V.epochCommitment.epoch,
        V.epochCommitment.group_context_hash
      )
    ).toBe(V.epochCommitment.value);
    expect(keccak256(utf8Encode("group context 8"))).toBe(
      V.epochCommitment.group_context_hash
    );
  });

  it("roster digest sorts keys", () => {
    expect(sortDeviceKeys(V.roster.device_keys)).toEqual(
      V.roster.sorted_device_keys
    );
    const digest = rosterDigest(V.group, V.roster.epoch, V.roster.device_keys);
    expect(digest).toBe(V.roster.roster_digest);
    expect(
      wasm.verifyEd25519(V.commitKey7, digestBytes(digest), V.roster.signature)
    ).toBe(true);
  });

  it("revoke digest", () => {
    const digest = revokeDigest(
      V.revoke.target,
      V.revoke.revoker,
      V.revoke.revoked_at_seconds
    );
    expect(digest).toBe(V.revoke.revoke_digest);
    expect(
      wasm.verifyEd25519(
        V.revoke.revoker,
        digestBytes(digest),
        V.revoke.signature
      )
    ).toBe(true);
  });

  it("message digest and sig64", () => {
    const body = utf8Encode(V.message.body_utf8);
    expect(keccak256(body)).toBe(V.message.body_hash);
    const digest = messageDigest(V.group, V.message.epoch, body);
    expect(digest).toBe(V.message.message_digest);
    expect(
      wasm.verifyEd25519(V.device1, digestBytes(digest), V.message.sig64)
    ).toBe(true);
  });

  it("wrap AADs", () => {
    expect(aadEntry(V.group, 7, "commit")).toBe(V.wrapAad.entry_commit_epoch_7);
    expect(aadEntry(V.group, 7, "proposal")).toBe(
      V.wrapAad.entry_proposal_epoch_7
    );
    expect(aadMessage(V.group, 7)).toBe(V.wrapAad.message_epoch_7);
  });

  it("fp and safety code", () => {
    expect(fp(utf8Encode(V.fingerprint.input_utf8))).toBe(V.fingerprint.fp);
    expect(safetyCodeFromFp(V.fingerprint.fp)).toBe("ae6f e11a 41a9 80cb");
  });

  it("matches the WASM's own vectors (codec.rs known answers)", () => {
    const g = `0x${"11".repeat(32)}`;
    expect(epochCommitment(g, 7, `0x${"22".repeat(32)}`)).toBe(
      "0x197bdcc693754d29e17976b88dbc6fa963e4703cc97bdf787d56eb1b9e976ba6"
    );
    expect(
      entryDigest({
        g,
        epoch: 3,
        kind: "commit",
        entryHash: `0x${"33".repeat(32)}`,
        epochCommitment: `0x${"44".repeat(32)}`,
        nextCommitKey: `0x${"55".repeat(32)}`,
        paddedLen: 2048,
      })
    ).toBe(
      "0xbd794bbcb933efd019690830c4fb14a496d8ace4a7a1a54fe35e156db8140dc0"
    );
    expect(
      revokeDigest(
        `0x${"66".repeat(32)}`,
        `0x${"77".repeat(32)}`,
        1_760_000_000
      )
    ).toBe(
      "0x1283d152a74d5985c69a5a38a5b0a80f1dc8110e665f28ef422904603528307e"
    );
    expect(messageDigest(g, 5, utf8Encode('{"v":1}'))).toBe(
      "0x848c3e0afacec639966233a19e3a5c7d4102b664e2ebb166ce06d71a45996e48"
    );
  });
});

describe("digests vs the WASM helpers (random inputs)", () => {
  it("agree for 20 random inputs", () => {
    for (let round = 0; round < 20; round += 1) {
      const g = randomHex(32);
      const epoch = round * 1_000_003;
      const keys = [randomHex(32), randomHex(32), randomHex(32)];
      const body = hexToBytes(randomHex(round + 1));
      expect(TAG(`name-${round}`)).toBe(wasm.hTag(`name-${round}`));
      expect(messageDigest(g, epoch, body)).toBe(
        wasm.messageDigest(g, epoch, body)
      );
      expect(revokeDigest(keys[0]!, keys[1]!, 1_760_000_000 + round)).toBe(
        wasm.revokeDigest(keys[0]!, keys[1]!, 1_760_000_000 + round)
      );
      expect(rosterDigest(g, epoch, keys)).toBe(
        wasm.rosterDigest(g, epoch, JSON.stringify(keys))
      );
      expect(epochCommitment(g, epoch, keys[2]!)).toBe(
        wasm.epochCommitment(g, epoch, keys[2]!)
      );
      const kind = round % 2 === 0 ? "commit" : "proposal";
      expect(
        entryDigest({
          g,
          epoch,
          kind,
          entryHash: keys[0]!,
          epochCommitment: keys[1]!,
          nextCommitKey: keys[2]!,
          paddedLen: 2048 * (round + 1),
        })
      ).toBe(
        wasm.entryDigest(
          g,
          epoch,
          kind,
          keys[0]!,
          keys[1]!,
          keys[2]!,
          2048 * (round + 1)
        )
      );
    }
  });

  it("rejects malformed bytes32 fields", () => {
    expect(() => rosterDigest("0x1234", 1, [])).toThrow("32-byte");
  });
});
