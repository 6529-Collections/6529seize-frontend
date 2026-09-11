import minimalPackage from "@/ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/valid/minimal-profile-homepage.package.json";
import { publicEnv } from "@/config/env";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import { withComputedCmsHashes } from "@/lib/profile-cms/protocol/v1";
import { commonApiFetch } from "@/services/api/common-api";
import {
  PROFILE_CMS_PRIMARY_SITE_ENDPOINT,
  clearProfileCmsRuntimeCacheForTests,
  fetchProfileCmsPrimarySite,
  normalizePrimarySiteResponse,
} from "@/lib/profile-cms/runtime/fetcher";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return { ...actual, publicEnv: { ...actual.publicEnv } };
});

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.Mock;
const fixturePackage = minimalPackage as unknown as CmsPackageV1;

function buildProductionPackage(): CmsPackageV1 {
  const packageWithoutFixtureArtifacts: CmsPackageV1 = {
    ...fixturePackage,
    signatures: [
      {
        type: "eip712",
        signer: "0xf58fE66AF1A8C792Cd64D8d706edDabAdFCB2FD0",
        signature: "0x1234",
        signed_at: "2026-06-17T00:00:00Z",
      },
    ],
    storage: [
      {
        provider: "ipfs",
        uri: "ipfs://bafyfixtureminimal",
        content_hash:
          "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        provider_content_id: "bafyfixtureminimal",
        pinned: true,
        canonical: true,
        recorded_at: "2026-06-17T00:00:00Z",
      },
    ],
  };
  const withHashes = withComputedCmsHashes(packageWithoutFixtureArtifacts);
  const storageReceipt = withHashes.storage[0];
  if (!storageReceipt) {
    throw new Error("Expected production package storage receipt.");
  }

  return {
    ...withHashes,
    storage: [
      {
        ...storageReceipt,
        content_hash: withHashes.integrity.package_hash,
      },
    ],
  };
}

describe("profile CMS primary-site fetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearProfileCmsRuntimeCacheForTests();
    delete publicEnv.PROFILE_CMS_RUNTIME_FIXTURE_PRIMARY;
    delete publicEnv.PROFILE_CMS_RUNTIME_ENABLED;
  });

  it("documents the canonical primary endpoint", () => {
    expect(PROFILE_CMS_PRIMARY_SITE_ENDPOINT).toBe(
      "profile-cms/{handle}/primary"
    );
  });

  it("accepts the narrow primary-site API envelope when hashes match", () => {
    const cmsPackage = buildProductionPackage();

    const site = normalizePrimarySiteResponse({
      package: cmsPackage,
      package_id: cmsPackage.package_id,
      version: "1",
      package_hash: cmsPackage.integrity.package_hash,
      payload_hash: cmsPackage.integrity.payload_hash,
      updated_at: "2026-06-17T00:00:00Z",
    });

    expect(site.source).toBe("api");
    expect(site.cmsPackage.package_id).toBe(cmsPackage.package_id);
    expect(site.packageHash).toBe(cmsPackage.integrity.package_hash);
    expect(site.payloadHash).toBe(cmsPackage.integrity.payload_hash);
    expect(site.updatedAt).toBe("2026-06-17T00:00:00Z");
  });

  it("rejects API packages that do not match the requested handle", () => {
    const cmsPackage = buildProductionPackage();

    expect(() =>
      normalizePrimarySiteResponse(
        {
          package: cmsPackage,
          package_hash: cmsPackage.integrity.package_hash,
          payload_hash: cmsPackage.integrity.payload_hash,
          updated_at: "2026-06-17T00:00:00Z",
        },
        { expectedHandle: "other-handle" }
      )
    ).toThrow("handle mismatch");
  });

  it("rejects API envelopes with mismatched hashes", () => {
    const cmsPackage = buildProductionPackage();

    expect(() =>
      normalizePrimarySiteResponse({
        package: cmsPackage,
        package_hash:
          "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        payload_hash: cmsPackage.integrity.payload_hash,
        updated_at: "2026-06-17T00:00:00Z",
      })
    ).toThrow("package_hash envelope mismatch");
  });

  it("rejects fixture signatures and storage from API packages", () => {
    expect(() =>
      normalizePrimarySiteResponse({
        package: fixturePackage,
        package_hash: fixturePackage.integrity.package_hash,
        payload_hash: fixturePackage.integrity.payload_hash,
        updated_at: "2026-06-17T00:00:00Z",
      })
    ).toThrow("signature.fixture_not_allowed");
  });

  it("returns null for no primary site", async () => {
    commonApiFetchMock.mockRejectedValueOnce({ status: 404 });

    await expect(
      fetchProfileCmsPrimarySite({
        handle: "Alice",
        headers: {
          Authorization: "Bearer private",
          "6529-auth": "private",
        },
      })
    ).resolves.toBeNull();

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "profile-cms/alice/primary",
      headers: {},
    });
  });

  it("returns null for the backend no-primary-site message", async () => {
    commonApiFetchMock.mockRejectedValueOnce(
      "Profile punk6529 has no primary published CMS package"
    );

    await expect(
      fetchProfileCmsPrimarySite({
        handle: "punk6529",
        headers: {},
      })
    ).resolves.toBeNull();
  });

  it("uses the dev fixture only when explicitly enabled and the API is unavailable", async () => {
    publicEnv.PROFILE_CMS_RUNTIME_FIXTURE_PRIMARY = "true";
    commonApiFetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const site = await fetchProfileCmsPrimarySite({
      handle: "punk6529",
      headers: {},
    });

    expect(site?.source).toBe("fixture");
    expect(site?.cmsPackage.profile.handle).toBe("punk6529");
  });
});
