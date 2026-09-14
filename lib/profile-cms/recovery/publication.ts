import {
  TypedDataEncoder,
  verifyTypedData,
  type TypedDataDomain,
} from "ethers";
import { sha256 } from "js-sha256";
import { z } from "zod";
import { CmsRecoveryError } from "./errors";

import {
  canonicalizeJson,
  cmsPackageSchema,
  validateCmsPackageV1,
  type CmsPackageV1,
} from "../protocol/v1";

export const CMS_PUBLICATION_SCHEMA = "6529.cms.publication.v1";
export const CMS_PUBLISH_TYPES = {
  ProfileCmsPublish: [
    { name: "action", type: "string" },
    { name: "profileId", type: "string" },
    { name: "handle", type: "string" },
    { name: "packageId", type: "string" },
    { name: "version", type: "uint256" },
    { name: "draftId", type: "string" },
    { name: "payloadHash", type: "string" },
    { name: "packageHash", type: "string" },
    { name: "primaryPath", type: "string" },
    { name: "storageProvider", type: "string" },
    { name: "storageUri", type: "string" },
    { name: "storageContentHash", type: "string" },
    { name: "deadline", type: "uint256" },
  ],
};

const boundedString = z.string().min(1).max(2048);
const hash = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const unsignedInteger = z.union([
  z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  z.string().regex(/^(0|[1-9][0-9]{0,77})$/),
]);

export const cmsPublicationSchema = z
  .object({
    schema: z.literal(CMS_PUBLICATION_SCHEMA),
    package_uri: boundedString,
    package_hash: hash,
    payload_hash: hash,
    profile_id: boundedString,
    profile_handle: boundedString,
    package_id: boundedString,
    package_db_id: boundedString,
    version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    primary_path: boundedString,
    typed_data: z
      .object({
        domain: z
          .object({
            name: z.literal("6529 Profile CMS"),
            version: z.literal("1"),
            chainId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
            verifyingContract: address.optional(),
          })
          .strict(),
        types: z.record(
          z.array(
            z.object({ name: boundedString, type: boundedString }).strict()
          )
        ),
        primaryType: z.literal("ProfileCmsPublish"),
        message: z
          .object({
            action: z.literal("publish"),
            profileId: boundedString,
            handle: boundedString,
            packageId: boundedString,
            version: unsignedInteger,
            draftId: boundedString,
            payloadHash: hash,
            packageHash: hash,
            primaryPath: boundedString,
            storageProvider: z.enum(["arweave", "ipfs"]),
            storageUri: boundedString,
            storageContentHash: hash,
            deadline: unsignedInteger,
          })
          .strict(),
      })
      .strict(),
    signature: z
      .string()
      .regex(/^0x[a-fA-F0-9]+$/)
      .max(131074)
      .refine((value) => value.length % 2 === 0),
    signature_kind: z.enum(["eoa", "eip1271"]),
    signer_address: address,
    package_envelope: z
      .object({
        integrity: cmsPackageSchema.shape.integrity,
        signatures: cmsPackageSchema.shape.signatures,
        storage: cmsPackageSchema.shape.storage,
      })
      .strict(),
    published_at: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();

export type CmsPublication = z.infer<typeof cmsPublicationSchema>;
export type CmsContractSignatureVerifier = (input: {
  chainId: number;
  signer: string;
  digest: string;
  signature: string;
}) => Promise<boolean>;

type RecoveredCmsPublication = {
  cmsPackage: CmsPackageV1;
  publication: CmsPublication;
  signer: string;
  verification: "eoa" | "eip1271-current-state";
};

/** Verify wallet authorship, not the centralized profile registry or current primary pointer. */
export async function recoverCmsPublication(
  input: unknown,
  contentBytes: Uint8Array,
  verifyContractSignature?: CmsContractSignatureVerifier
): Promise<RecoveredCmsPublication> {
  const publication = cmsPublicationSchema.parse(input);
  assertEqual(
    canonicalizeJson(publication.typed_data.types),
    canonicalizeJson(CMS_PUBLISH_TYPES),
    "typed-data types"
  );
  assertPublicationBindings(publication);
  assertEqual(
    `sha256:${sha256(contentBytes)}`,
    publication.package_hash,
    "stored content hash"
  );
  const core: unknown = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(contentBytes)
  );
  const coreRecord = z.record(z.unknown()).parse(core);
  if ("signatures" in coreRecord || "storage" in coreRecord) {
    throw new CmsRecoveryError(
      "CMS publication content must be the canonical unsigned content core"
    );
  }
  const cmsPackage = cmsPackageSchema.parse({
    ...coreRecord,
    ...publication.package_envelope,
  });
  const validation = validateCmsPackageV1(cmsPackage, {
    allowFixtureSignatures: false,
    allowFixtureStorage: false,
    enforceHashes: true,
  });
  if (!validation.valid) {
    throw new CmsRecoveryError(
      `Invalid recovered CMS package: ${validation.issues
        .filter((issue) => issue.severity === "error")
        .map((issue) => issue.code)
        .join(", ")}`
    );
  }
  assertPackageBindings(publication, cmsPackage);
  const { domain, message } = publication.typed_data;
  const digest = TypedDataEncoder.hash(
    toEthersDomain(domain),
    CMS_PUBLISH_TYPES,
    message
  );
  assertSignatureEnvelope(publication, digest);
  await assertSignature(publication, digest, verifyContractSignature);
  return {
    cmsPackage,
    publication,
    signer: publication.signer_address,
    verification:
      publication.signature_kind === "eoa" ? "eoa" : "eip1271-current-state",
  };
}

function assertPublicationBindings(publication: CmsPublication): void {
  const message = publication.typed_data.message;
  const pairs = [
    [publication.package_uri, message.storageUri, "storage URI"],
    [publication.package_hash, message.packageHash, "package hash"],
    [publication.package_hash, message.storageContentHash, "storage hash"],
    [publication.payload_hash, message.payloadHash, "payload hash"],
    [publication.profile_id, message.profileId, "profile ID"],
    [publication.profile_handle, message.handle, "profile handle"],
    [publication.package_id, message.packageId, "package ID"],
    [publication.package_db_id, message.draftId, "draft ID"],
    [String(publication.version), String(message.version), "version"],
    [publication.primary_path, message.primaryPath, "primary path"],
  ];
  for (const [actual, expected, field] of pairs) {
    assertEqual(actual, expected, field ?? "publication field");
  }
  assertEqual(
    publication.primary_path,
    `/${message.handle}/index.html`,
    "canonical primary path"
  );
}

function assertPackageBindings(
  publication: CmsPublication,
  cmsPackage: CmsPackageV1
): void {
  assertEqual(
    cmsPackage.package_id,
    publication.package_id,
    "content package ID"
  );
  assertEqual(
    cmsPackage.profile.handle.toLowerCase(),
    publication.profile_handle.toLowerCase(),
    "content handle"
  );
  if (cmsPackage.profile.profile_id) {
    assertEqual(
      cmsPackage.profile.profile_id,
      publication.profile_id,
      "content profile ID"
    );
  }
  // Imported cores preserve authored handle casing and may choose another
  // in-profile site.base_path. Publishing signs the live profile's canonical
  // root; recovery must keep the hash-bound core unchanged.
  const coreRoot = `/${cmsPackage.profile.handle}/index.html`;
  assertEqual(
    cmsPackage.payload.routes.some((route) => route.path === coreRoot),
    true,
    "content profile root route"
  );
  assertEqual(
    cmsPackage.integrity.package_hash,
    publication.package_hash,
    "envelope package hash"
  );
  assertEqual(
    cmsPackage.integrity.payload_hash,
    publication.payload_hash,
    "envelope payload hash"
  );
  const message = publication.typed_data.message;
  const receipt = cmsPackage.storage.find(
    (candidate) => candidate.canonical === true
  );
  assertEqual(receipt?.uri, publication.package_uri, "canonical storage URI");
  assertEqual(
    receipt?.content_hash,
    publication.package_hash,
    "canonical storage hash"
  );
  assertEqual(
    receipt?.provider,
    message.storageProvider,
    "canonical storage provider"
  );
}

function assertSignatureEnvelope(
  publication: CmsPublication,
  digest: string
): void {
  const matching = publication.package_envelope.signatures.find(
    (entry) =>
      entry.type === "eip712" &&
      entry.signer.toLowerCase() === publication.signer_address.toLowerCase() &&
      entry.signature.toLowerCase() === publication.signature.toLowerCase()
  );
  assertEqual(
    matching?.domain?.["typed_data_hash"],
    digest,
    "envelope signature digest"
  );
}

async function assertSignature(
  publication: CmsPublication,
  digest: string,
  verifier?: CmsContractSignatureVerifier
): Promise<void> {
  if (publication.signature_kind === "eip1271") {
    if (!verifier) {
      throw new CmsRecoveryError(
        "Contract-wallet verification requires an explicit chain RPC; offline verification is unavailable"
      );
    }
    const valid = await verifier({
      chainId: publication.typed_data.domain.chainId,
      signer: publication.signer_address,
      digest,
      signature: publication.signature,
    });
    if (!valid)
      throw new CmsRecoveryError(
        "Invalid contract-wallet CMS publication signature"
      );
    return;
  }
  const signer = verifyTypedData(
    toEthersDomain(publication.typed_data.domain),
    CMS_PUBLISH_TYPES,
    publication.typed_data.message,
    publication.signature
  );
  assertEqual(
    signer.toLowerCase(),
    publication.signer_address.toLowerCase(),
    "recovered signer"
  );
}

function assertEqual(actual: unknown, expected: unknown, field: string): void {
  if (actual !== expected)
    throw new CmsRecoveryError(`CMS publication ${field} mismatch`);
}

function toEthersDomain(
  domain: CmsPublication["typed_data"]["domain"]
): TypedDataDomain {
  return { ...domain, verifyingContract: domain.verifyingContract ?? null };
}
