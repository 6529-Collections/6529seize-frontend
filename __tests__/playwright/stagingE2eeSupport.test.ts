/**
 * @jest-environment node
 */
import { inflateSync } from "node:zlib";

import {
  getBytes,
  hexlify,
  toUtf8Bytes,
  verifyMessage,
  verifyTypedData,
} from "ethers";

import {
  E2eeNetworkEvidence,
  findPlaintext,
  plaintextEncodings,
} from "../../tests/support/staging-e2ee/evidence";
import {
  crc32,
  createQaImage,
  qaMessage,
} from "../../tests/support/staging-e2ee/fixtures";
import {
  handleScriptedWalletRequest,
  PROVIDER_ERROR,
  ScriptedWalletKey,
  type ScriptedWalletState,
} from "../../tests/support/scriptedWallet";

const GRANT_TYPED_DATA = {
  domain: {
    name: "6529 Encrypted Messages",
    version: "1",
    salt: `0x${"ab".repeat(32)}`,
  },
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "salt", type: "bytes32" },
    ],
    MlsDeviceGrant: [
      { name: "statement", type: "string" },
      { name: "wallet", type: "address" },
      { name: "deviceKey", type: "bytes32" },
      { name: "ciphersuite", type: "uint16" },
      { name: "issuedAt", type: "uint64" },
      { name: "expiresAt", type: "uint64" },
      { name: "origin", type: "string" },
    ],
  },
  primaryType: "MlsDeviceGrant",
};

function newWallet() {
  const key = ScriptedWalletKey.random();
  const state: ScriptedWalletState = { authorized: false, signatures: [] };
  const request = (method: string, params?: unknown) =>
    handleScriptedWalletRequest(key, state, { method, params });
  return { key, state, request };
}

describe("scripted EIP-1193 wallet", () => {
  it("never serializes or inspects as its private key", () => {
    const key = ScriptedWalletKey.random();
    expect(JSON.stringify({ key })).toBe(
      JSON.stringify({ key: { address: key.address } })
    );
    expect(String(key)).toBe(`ScriptedWalletKey(${key.address})`);
    expect(Object.keys(key)).toEqual(["address"]);
  });

  it("exposes accounts only after the page asks to connect", async () => {
    const { key, request } = newWallet();
    expect(await request("eth_accounts")).toEqual({ ok: true, result: [] });
    expect(await request("personal_sign", ["0x00", key.address])).toEqual({
      ok: false,
      error: { code: PROVIDER_ERROR.unauthorized, message: "Not connected." },
    });
    expect(await request("eth_requestAccounts")).toEqual({
      ok: true,
      result: [key.address],
    });
    expect(await request("eth_accounts")).toEqual({
      ok: true,
      result: [key.address],
    });
    expect(await request("eth_chainId")).toEqual({ ok: true, result: "0x1" });
  });

  it("signs the sign-in message as personal_sign for its own account only", async () => {
    const { key, state, request } = newWallet();
    await request("eth_requestAccounts");
    const message = "Sign in to 6529\nNonce: 1234";
    const reply = await request("personal_sign", [
      hexlify(toUtf8Bytes(message)),
      key.address.toLowerCase(),
    ]);
    expect(reply.ok).toBe(true);
    expect(verifyMessage(message, (reply as { result: string }).result)).toBe(
      key.address
    );
    expect(state.signatures).toEqual([{ method: "personal_sign" }]);

    const other = ScriptedWalletKey.random();
    const refused = await request("personal_sign", ["0x00", other.address]);
    expect(refused).toMatchObject({
      ok: false,
      error: { code: PROVIDER_ERROR.unauthorized },
    });
  });

  it("signs eth_signTypedData_v4 JSON with string integers like wagmi sends", async () => {
    const { key, state, request } = newWallet();
    await request("eth_requestAccounts");
    const message = {
      statement: "Let this device send and read end-to-end encrypted messages",
      wallet: key.address,
      deviceKey: `0x${"cd".repeat(32)}`,
      ciphersuite: 1,
      issuedAt: "1761900000",
      expiresAt: "1777452000",
      origin: "staging.6529.io",
    };
    const reply = await request("eth_signTypedData_v4", [
      key.address,
      JSON.stringify({ ...GRANT_TYPED_DATA, message }),
    ]);
    expect(reply.ok).toBe(true);
    const signature = (reply as { result: string }).result;
    const types = { MlsDeviceGrant: GRANT_TYPED_DATA.types.MlsDeviceGrant };
    expect(
      verifyTypedData(GRANT_TYPED_DATA.domain, types, message, signature)
    ).toBe(key.address);
    expect(state.signatures).toEqual([
      {
        method: "eth_signTypedData_v4",
        primaryType: "MlsDeviceGrant",
        domainName: "6529 Encrypted Messages",
        message,
        signature,
      },
    ]);
  });

  it("refuses other chains and unknown methods with EIP-1193 codes", async () => {
    const { request } = newWallet();
    expect(
      await request("wallet_switchEthereumChain", [{ chainId: "0x1" }])
    ).toEqual({ ok: true, result: null });
    expect(
      await request("wallet_switchEthereumChain", [{ chainId: "0xaa36a7" }])
    ).toMatchObject({
      ok: false,
      error: { code: PROVIDER_ERROR.unrecognizedChain },
    });
    expect(await request("eth_sendTransaction", [{}])).toMatchObject({
      ok: false,
      error: { code: PROVIDER_ERROR.unsupportedMethod },
    });
  });
});

describe("staging E2EE plaintext evidence", () => {
  const secret = qaMessage("run1", "A to B");
  const needles = new Map([["hello", plaintextEncodings(secret)]]);

  it.each([0, 1, 2])(
    "finds the plaintext base64-encoded at byte offset %i of a larger field",
    (offset) => {
      const field = Buffer.concat([
        Buffer.alloc(offset, 7),
        Buffer.from(secret, "utf8"),
        Buffer.from([1, 2, 3, 4]),
      ]);
      for (const encoding of ["base64", "base64url"] as const) {
        const body = JSON.stringify({ data: field.toString(encoding) });
        expect(findPlaintext(body, needles)).toEqual(["hello"]);
      }
    }
  );

  it("finds raw, JSON-escaped, URL-encoded and hex plaintext", () => {
    expect(findPlaintext(JSON.stringify({ text: secret }), needles)).toEqual([
      "hello",
    ]);
    expect(
      findPlaintext(`/api/search?q=${encodeURIComponent(secret)}`, needles)
    ).toEqual(["hello"]);
    expect(findPlaintext(Buffer.from(secret).toString("hex"), needles)).toEqual(
      ["hello"]
    );
    const unicode = "Grüße → e2ee-qa unicode check";
    expect(
      findPlaintext(
        JSON.stringify({ text: unicode }).replaceAll(
          /[\u007f-￿]/gu,
          (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
        ),
        new Map([["unicode", plaintextEncodings(unicode)]])
      )
    ).toEqual(["unicode"]);
  });

  it("does not flag ciphertext-like data", () => {
    const random = Buffer.from(
      getBytes(`0x${"5a".repeat(32)}${"c3".repeat(64)}`)
    );
    expect(
      findPlaintext(
        JSON.stringify({ data: random.toString("base64"), epoch: 3 }),
        needles
      )
    ).toEqual([]);
  });

  it("reports leaks by endpoint without echoing the body", () => {
    const evidence = new E2eeNetworkEvidence("https://staging.6529.io");
    evidence.requests.push(
      {
        method: "POST",
        url: "https://api.staging.6529.io/api/e2ee/groups/0xabc/messages?x=1",
        body: Buffer.from(JSON.stringify({ data: secret })),
        bodyBytes: 10,
      },
      {
        method: "PUT",
        url: "https://api.staging.6529.io/api/e2ee/blobs/b1/chunks/0",
        body: null,
        bodyBytes: 5 * 1024 * 1024,
      }
    );
    evidence.webSocketFrames.push(`{"typing":"${secret}"}`);
    expect(evidence.findLeaks(needles)).toEqual([
      {
        needle: "hello",
        where:
          "POST https://api.staging.6529.io/api/e2ee/groups/0xabc/messages",
      },
      { needle: "hello", where: "WebSocket frame sent" },
    ]);
    expect(evidence.unscannedRequests()).toEqual([
      `PUT https://api.staging.6529.io/api/e2ee/blobs/b1/chunks/0 (${5 * 1024 * 1024} bytes)`,
    ]);
  });
});

describe("staging E2EE QA image", () => {
  it("is a valid 2x2 RGBA PNG carrying its marker", () => {
    const image = createQaImage("run1");
    const { buffer } = image;
    expect(buffer.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    const chunks: { type: string; data: Buffer }[] = [];
    let offset = 8;
    while (offset < buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const type = buffer.subarray(offset + 4, offset + 8).toString("latin1");
      const data = buffer.subarray(offset + 8, offset + 8 + length);
      const crc = buffer.readUInt32BE(offset + 8 + length);
      expect(crc).toBe(crc32(buffer.subarray(offset + 4, offset + 8 + length)));
      chunks.push({ type, data });
      offset += 12 + length;
    }
    expect(chunks.map((chunk) => chunk.type)).toEqual([
      "IHDR",
      "tEXt",
      "IDAT",
      "IEND",
    ]);
    const header = chunks[0]!.data;
    expect([header.readUInt32BE(0), header.readUInt32BE(4)]).toEqual([2, 2]);
    expect([header[8], header[9]]).toEqual([8, 6]);
    expect(chunks[1]!.data.toString("latin1")).toBe(`Comment\0${image.marker}`);
    const raw = [...inflateSync(chunks[2]!.data)];
    expect(raw).toEqual([
      0,
      ...image.rgba.slice(0, 8),
      0,
      ...image.rgba.slice(8, 16),
    ]);
    expect(image.rgba.filter((_, index) => index % 4 === 3)).toEqual([
      255, 255, 255, 255,
    ]);
    expect(image.name).toMatch(/^e2ee-qa-run1-[0-9a-f]{6}\.png$/u);
  });

  it("uses the standard CRC-32", () => {
    expect(crc32(Buffer.from("IEND", "latin1"))).toBe(0xae426082);
  });
});
