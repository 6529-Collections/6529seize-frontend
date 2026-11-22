/**
 * @jest-environment node
 */
import { installNodeWebCrypto } from "../device-signing/device-signing-test-utils";

const mockEnv: { NEXT_PUBLIC_FEATURE_MINT_SIGNED_WRITES?: string | undefined } =
  {};
jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return { ...actual.publicEnv, ...mockEnv };
    },
  };
});

const mockSignRecords = jest.fn();
jest.mock("@/lib/signed-records/sign-records", () => {
  const actual = jest.requireActual("@/lib/signed-records/sign-records");
  return {
    ...actual,
    signRecords: (...args: unknown[]) => mockSignRecords(...args),
  };
});

import {
  MINT_ADMIN_ROUTES,
  MINT_USER_ROUTES,
  mintAdminRecordHeaders,
  mintUserRecordHeaders,
  setMintRecordContextSource,
  sha256Hex,
} from "@/lib/mint-records/mint-admin-records";
import { SIGNED_RECORDS_HEADER } from "@/lib/signed-records/record-event";

const PRINCIPAL = `0x${"0".repeat(63)}1`;

const airdrops = {
  action: "dist.airdrops" as const,
  route: MINT_ADMIN_ROUTES.distArtistAirdrops,
  params: { contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1", id: "100" },
  body: {
    csv: [
      "0x0000000000000000000000000000000000000001,2",
      "0x0000000000000000000000000000000000000002,1",
    ].join("\n"),
  },
};

/** The body of a signed mint record. */
interface SignedMintBody {
  readonly action: string;
  readonly route: string;
  readonly params: Readonly<Record<string, string>>;
  readonly request_sha256: string;
}

/** The record body signed for a request, captured from signRecords. */
async function signedBody(
  request: Parameters<typeof mintAdminRecordHeaders>[0]
): Promise<SignedMintBody> {
  mockSignRecords.mockClear();
  await mintAdminRecordHeaders(request);
  return mockSignRecords.mock.calls[0][0][0].body;
}

describe("mint admin records", () => {
  beforeAll(() => installNodeWebCrypto());

  beforeEach(() => {
    mockSignRecords.mockReset();
    mockSignRecords.mockResolvedValue({
      status: "signed",
      events: [{ id: "0xevent" }],
      grantId: "0xgrant",
    });
    mockEnv.NEXT_PUBLIC_FEATURE_MINT_SIGNED_WRITES = "true";
    setMintRecordContextSource(async () => ({
      principal: PRINCIPAL,
      anchor: 1000,
    }));
  });

  it("sends one signed mint.admin record in the admin's public stream", async () => {
    const headers = await mintAdminRecordHeaders(airdrops);

    const [drafts, options] = mockSignRecords.mock.calls[0];
    expect(options).toEqual({ anchor: 1000 });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      kind: 9,
      wave: `ps/${PRINCIPAL}`,
      body: {
        action: "dist.airdrops",
        route: airdrops.route,
        params: airdrops.params,
      },
    });
    expect(drafts[0].refs[0]).toBe("mint.admin");
    expect(drafts[0].refs[1]).toMatch(/^[0-9a-f-]{36}$/);
    expect(
      JSON.parse(
        Buffer.from(headers[SIGNED_RECORDS_HEADER]!, "base64url").toString(
          "utf8"
        )
      )
    ).toEqual([{ id: "0xevent" }]);
  });

  it("hashes each request exactly as the API does", async () => {
    // The same vectors are pinned in the API's mint-log-intent tests.
    expect((await signedBody(airdrops)).request_sha256).toBe(
      "1688590332587dd1cf75b623b6c34daa64d50a83dfaf3ac21535a0ba57bbdb86"
    );
    expect(
      (
        await signedBody({
          action: "dist.phase",
          route: MINT_ADMIN_ROUTES.distPhase,
          params: {
            token_id: "100",
            phase_id: "p1",
            contract: "0xabc",
            allowlist_id: "a1",
          },
        })
      ).request_sha256
    ).toBe("8d59f391969e2a2756b6b8e9117a3331615d065f03b736618b49833549e72e89");
  });

  it("counts no body and an empty object as no body, after the wire trip", async () => {
    const request = {
      action: "dist.normalize" as const,
      route: MINT_ADMIN_ROUTES.distNormalize,
      params: { contract: "0xabc", id: "1" },
    };
    const none = (await signedBody(request)).request_sha256;
    expect((await signedBody({ ...request, body: {} })).request_sha256).toBe(
      none
    );
    expect(
      (await signedBody({ ...request, body: { skipped: undefined } }))
        .request_sha256
    ).toBe(none);
    expect(
      (await signedBody({ ...request, body: { csv: "x" } })).request_sha256
    ).not.toBe(none);
  });

  it("signs a collaboration reply as a mint.user record", async () => {
    await mintUserRecordHeaders({
      action: "collab.respond",
      route: MINT_USER_ROUTES.collabRespond,
      params: { drop_id: "drop", invitation_id: "inv-1" },
      body: {
        action: "DECLINE",
        artwork_hash: "a".repeat(64),
        terms_version: "b".repeat(64),
      },
    });
    const [drafts] = mockSignRecords.mock.calls[0];
    expect(drafts[0].refs[0]).toBe("mint.user");
    expect(drafts[0].wave).toBe(`ps/${PRINCIPAL}`);
    // The same vector is pinned in the API's mint-log-intent tests.
    expect(drafts[0].body).toEqual({
      action: "collab.respond",
      route: "POST /drops/:drop_id/collaborations/:invitation_id/response",
      params: { drop_id: "drop", invitation_id: "inv-1" },
      request_sha256:
        "7d159e21780275c8248076fc3908fa9a4df05f797c13a480728a0c4114e77f02",
    });
  });

  it("hashes a file's bytes", async () => {
    await expect(sha256Hex(new Blob(["abc"]))).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("sends no header when the flag is off", async () => {
    mockEnv.NEXT_PUBLIC_FEATURE_MINT_SIGNED_WRITES = undefined;
    await expect(mintAdminRecordHeaders(airdrops)).resolves.toEqual({});
    expect(mockSignRecords).not.toHaveBeenCalled();
  });

  it("sends no header while the principal or anchor is unknown", async () => {
    setMintRecordContextSource(async () => null);
    await expect(mintAdminRecordHeaders(airdrops)).resolves.toEqual({});
    expect(mockSignRecords).not.toHaveBeenCalled();
  });

  it("sends no header, and lets the write go, when signing throws", async () => {
    mockSignRecords.mockRejectedValue(new Error("device key unavailable"));
    await expect(mintAdminRecordHeaders(airdrops)).resolves.toEqual({});
    setMintRecordContextSource(async () => {
      throw new Error("no anchor");
    });
    await expect(mintAdminRecordHeaders(airdrops)).resolves.toEqual({});
  });

  it("sends no header when this device cannot sign", async () => {
    mockSignRecords.mockResolvedValue({ status: "no-grant" });
    await expect(mintAdminRecordHeaders(airdrops)).resolves.toEqual({});
    mockSignRecords.mockResolvedValue({ status: "failed", reason: "timeout" });
    await expect(mintAdminRecordHeaders(airdrops)).resolves.toEqual({});
  });
});
