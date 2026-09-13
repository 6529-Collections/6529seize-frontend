import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { buildMemesSubmissionTypedData } from "@/services/wallet-signatures/memes-submission-signature";
import { hashTypedData, recoverTypedDataAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import golden from "./fixtures/memes-submission-v1.json";

// Public deterministic test key, never a funded or operational wallet.
const account = privateKeyToAccount(`0x${"01".repeat(32)}`);
const wave = {
  id: "00000000-0000-4000-8000-000000000652",
  name: "The Memes Main Stage",
};
const termsOfService = "Original test submission terms.\nVersion 1.";
const issuedAt = new Date("2026-09-13T12:00:00.000Z");
const nonce = "00000000-0000-4000-8000-000000000001";
const makeDrop = (): ApiCreateDropRequest => ({
  wave_id: wave.id,
  drop_type: ApiDropType.Participatory,
  title: "An original Meme — 你好",
  parts: [
    {
      content: "An original test artwork",
      media: [{ url: "https://example.com/art.png", mime_type: "image/png" }],
    },
  ],
  referenced_nfts: [],
  mentioned_users: [],
  metadata: [{ data_key: "artist", data_value: "Test Artist" }],
  signature: null,
  signer_address: account.address,
});
const build = (drop = makeDrop(), terms = termsOfService) =>
  buildMemesSubmissionTypedData({
    drop,
    termsOfService: terms,
    wave,
    issuedAt,
    nonce,
    audience: "api.6529.io",
    origin: "https://6529.io",
  });

// An explicit EIP712Domain schema gives viem's uint256 a bigint type.
// The JSON envelope keeps a numeric chain ID; both encode identically.
const toViemTypedData = (
  typedData: ReturnType<typeof buildMemesSubmissionTypedData>
) => ({
  ...typedData,
  domain: { ...typedData.domain, chainId: BigInt(typedData.domain.chainId) },
});

describe("Memes submission typed signing", () => {
  it("matches the backend ethers golden vector using viem independently", async () => {
    const verification = golden.typedData.message.Verification;
    const typedData = buildMemesSubmissionTypedData({
      drop: { ...golden.drop, drop_type: ApiDropType.Participatory },
      termsOfService: golden.terms,
      wave: golden.wave,
      issuedAt: new Date(verification.IssuedAt),
      nonce: verification.Nonce,
      audience: verification.Audience,
      origin: verification.Origin,
    });
    expect(typedData).toEqual(golden.typedData);
    expect(hashTypedData(toViemTypedData(typedData))).toBe(
      golden.typedDataHash
    );
    expect(
      await recoverTypedDataAddress({
        ...toViemTypedData(typedData),
        signature: golden.signature as `0x${string}`,
      })
    ).toBe(golden.drop.signer_address);
  });
  it("recovers a real signature over the exact JSON envelope", async () => {
    const typedData = build();
    const signature = await account.signTypedData(toViemTypedData(typedData));
    const received: typeof typedData = JSON.parse(JSON.stringify(typedData));
    expect(
      await recoverTypedDataAddress({ ...toViemTypedData(received), signature })
    ).toBe(account.address);
    expect(received.message).toMatchObject({
      Action: "Submit a Meme Card to The Memes",
      Artwork: "An original Meme — 你好",
      Destination: wave.name,
      Agreement: "I agree to The Memes submission terms I reviewed.",
      ExpiresAt: "2026-09-13T12:05:00.000Z",
    });
    expect(received.domain).toEqual({
      name: "The Memes",
      version: "1",
      chainId: 1,
    });
  });

  it("binds changes to media, metadata, description, destination and terms", () => {
    const original = build();
    const changedMedia = makeDrop();
    changedMedia.parts[0]!.media[0]!.url = "https://example.com/different.png";
    const changedMetadata = makeDrop();
    changedMetadata.metadata[0]!.data_value = "Different artist";
    const changedDescription = makeDrop();
    changedDescription.parts[0]!.content = "Different description";
    for (const changed of [
      build(changedMedia),
      build(changedMetadata),
      build(changedDescription),
      build(makeDrop(), "Changed terms"),
    ]) {
      expect(changed.message.Verification.PayloadHash).not.toBe(
        original.message.Verification.PayloadHash
      );
      expect(hashTypedData(toViemTypedData(changed))).not.toBe(
        hashTypedData(toViemTypedData(original))
      );
    }
    expect(
      hashTypedData({
        ...toViemTypedData(original),
        message: { ...original.message, Destination: "Another wave" },
      })
    ).not.toBe(hashTypedData(toViemTypedData(original)));
    expect(
      build(makeDrop(), "Changed terms").message.Verification.TermsHash
    ).not.toBe(original.message.Verification.TermsHash);
  });

  it("excludes request-only signatures and preserves canonical payload key ordering", () => {
    const drop = makeDrop();
    const reordered = {
      signature_message: "prior envelope",
      ...Object.fromEntries(Object.entries(drop).reverse()),
      signature: "prior signature",
    } as ApiCreateDropRequest;
    expect(build(reordered)).toEqual(build(drop));
  });

  it("keeps authoritative wave names unchanged, including trailing spaces", () => {
    const typedData = buildMemesSubmissionTypedData({
      drop: makeDrop(),
      termsOfService,
      wave: { ...wave, name: "The Memes - Main Stage " },
      issuedAt,
      nonce,
      audience: "api.staging.6529.io",
      origin: "https://staging.6529.io",
    });
    expect(typedData.message.Destination).toBe("The Memes - Main Stage ");
    expect(typedData.message.Verification.Audience).toBe("api.staging.6529.io");
  });

  it.each([null, "", "   "])("refuses missing terms %p", (terms) => {
    expect(() =>
      buildMemesSubmissionTypedData({
        drop: makeDrop(),
        wave,
        termsOfService: terms,
      })
    ).toThrow();
  });

  it.each([
    { title: " leading whitespace" },
    { title: "" },
    { drop_type: ApiDropType.Chat },
    { wave_id: "other-wave" },
    { signer_address: "invalid" },
  ])("rejects incomplete or mismatched submission details %p", (changes) => {
    expect(() => build({ ...makeDrop(), ...changes })).toThrow();
  });
});
