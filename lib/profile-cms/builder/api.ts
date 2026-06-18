import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import {
  createMockWalletGallerySnapshot,
  type WalletGallerySnapshot,
  type WalletGallerySnapshotAsset,
  type WalletGallerySnapshotCollection,
  type WalletGallerySource,
} from "@/lib/profile-cms/builder/gallery";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import { commonApiPost } from "@/services/api/common-api";

export const PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT =
  "profile-cms/gallery/snapshots";
export const PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT = "profile-cms/packages";
export const PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT =
  "profile-cms/packages/validate";
export const PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT =
  "profile-cms/packages/{id}/publish";

export type ProfileCmsBuilderAction = "save_draft" | "validate" | "publish";
export type ProfileCmsBuilderActionCode =
  | "api_disabled"
  | "missing_draft_id"
  | "missing_profile_id"
  | "profile_not_authorized"
  | "publish_requires_signed_storage"
  | "request_failed"
  | "server_validation_completed"
  | "draft_saved";

export type ProfileCmsBuilderActionResult =
  | {
      readonly ok: true;
      readonly action: ProfileCmsBuilderAction;
      readonly code: ProfileCmsBuilderActionCode;
      readonly draftId?: string | undefined;
      readonly packageHash?: string | undefined;
    }
  | {
      readonly ok: false;
      readonly action: ProfileCmsBuilderAction;
      readonly code: ProfileCmsBuilderActionCode;
      readonly expectedEndpoint: string;
    };

type BuilderActionResponse = {
  readonly draft_id?: string | undefined;
  readonly package_hash?: string | undefined;
  readonly message?: string | undefined;
};

type GallerySnapshotResponse = {
  readonly snapshot_id?: string | undefined;
  readonly source?: "api" | "fixture" | undefined;
  readonly wallets?: readonly {
    readonly kind?: "address" | "ens" | undefined;
    readonly input?: string | undefined;
    readonly normalized?: string | undefined;
  }[];
  readonly captured_at?: string | undefined;
  readonly block_number?: number | undefined;
  readonly assets?: readonly {
    readonly id?: string | undefined;
    readonly title?: string | undefined;
    readonly collection_id?: string | undefined;
    readonly collection_name?: string | undefined;
    readonly contract?: string | undefined;
    readonly token_id?: string | undefined;
    readonly chain_id?: number | undefined;
    readonly owner?: string | undefined;
    readonly image_uri?: string | undefined;
    readonly mime_type?: string | undefined;
    readonly width?: number | undefined;
    readonly height?: number | undefined;
    readonly metadata_uri?: string | undefined;
    readonly media_state?: "ready" | "partial" | "missing" | undefined;
    readonly alt_text?: string | undefined;
  }[];
  readonly collections?: readonly {
    readonly id?: string | undefined;
    readonly name?: string | undefined;
    readonly slug?: string | undefined;
    readonly contract?: string | undefined;
    readonly chain_id?: number | undefined;
    readonly asset_ids?: readonly string[] | undefined;
  }[];
  readonly warnings?: readonly string[] | undefined;
};

export async function runProfileCmsBuilderAction({
  action,
  cmsPackage,
  draftId,
  profileId,
}: {
  readonly action: ProfileCmsBuilderAction;
  readonly cmsPackage: CmsPackageV1;
  readonly draftId?: string | undefined;
  readonly profileId?: string | undefined;
}): Promise<ProfileCmsBuilderActionResult> {
  const endpoint = getEndpoint({ action, draftId });

  if (action === "publish") {
    return {
      ok: false,
      action,
      expectedEndpoint: endpoint,
      code: "publish_requires_signed_storage",
    };
  }

  if (!isProfileCmsBuilderApiEnabledEnv()) {
    return {
      ok: false,
      action,
      expectedEndpoint: endpoint,
      code: "api_disabled",
    };
  }

  if (action === "save_draft" && !profileId) {
    return {
      ok: false,
      action,
      expectedEndpoint: endpoint,
      code: "missing_profile_id",
    };
  }

  const response = await postBuilderAction({
    action,
    cmsPackage,
    endpoint,
    profileId,
  });

  return {
    ok: true,
    action,
    code: getSuccessCode(action),
    ...(response.draft_id ? { draftId: response.draft_id } : {}),
    ...(response.package_hash ? { packageHash: response.package_hash } : {}),
  };
}

export async function requestProfileCmsGallerySnapshot({
  handle,
  profileId,
  sources,
}: {
  readonly handle: string;
  readonly profileId?: string | undefined;
  readonly sources: readonly WalletGallerySource[];
}): Promise<WalletGallerySnapshot> {
  if (!isProfileCmsBuilderApiEnabledEnv()) {
    return createMockWalletGallerySnapshot({ handle, sources });
  }

  const response = await commonApiPost<
    {
      readonly profile_id?: string | undefined;
      readonly wallets: readonly {
        readonly kind: WalletGallerySource["kind"];
        readonly input: string;
        readonly normalized: string;
      }[];
    },
    GallerySnapshotResponse
  >({
    endpoint: PROFILE_CMS_GALLERY_SNAPSHOT_ENDPOINT,
    body: {
      ...(profileId ? { profile_id: profileId } : {}),
      wallets: sources.map((source) => ({
        kind: source.kind,
        input: source.input,
        normalized: source.normalized,
      })),
    },
    errorMode: "structured",
  });

  return normalizeGallerySnapshotResponse(response, sources);
}

function getEndpoint({
  action,
  draftId,
}: {
  readonly action: ProfileCmsBuilderAction;
  readonly draftId?: string | undefined;
}): string {
  switch (action) {
    case "save_draft":
      return PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT;
    case "validate":
      return PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT;
    case "publish":
      return draftId
        ? PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT.replace(
            "{id}",
            encodeURIComponent(draftId)
          )
        : PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT.replace("{id}", ":id");
  }
}

async function postBuilderAction({
  action,
  cmsPackage,
  endpoint,
  profileId,
}: {
  readonly action: ProfileCmsBuilderAction;
  readonly cmsPackage: CmsPackageV1;
  readonly endpoint: string;
  readonly profileId?: string | undefined;
}): Promise<BuilderActionResponse> {
  switch (action) {
    case "save_draft":
      return await commonApiPost<
        { readonly cms_package: CmsPackageV1; readonly profile_id: string },
        BuilderActionResponse
      >({
        endpoint,
        body: { profile_id: profileId ?? "", cms_package: cmsPackage },
        errorMode: "structured",
      });
    case "validate":
      return await commonApiPost<
        {
          readonly allow_fixture_signatures: boolean;
          readonly allow_fixture_storage: boolean;
          readonly cms_package: CmsPackageV1;
          readonly enforce_hashes: boolean;
        },
        BuilderActionResponse
      >({
        endpoint,
        body: {
          cms_package: cmsPackage,
          allow_fixture_signatures: true,
          allow_fixture_storage: true,
          enforce_hashes: true,
        },
        errorMode: "structured",
      });
    case "publish":
      throw new Error("unsupported_publish_action");
  }
}

function getSuccessCode(
  action: ProfileCmsBuilderAction
): ProfileCmsBuilderActionCode {
  switch (action) {
    case "save_draft":
      return "draft_saved";
    case "validate":
      return "server_validation_completed";
    case "publish":
      return "publish_requires_signed_storage";
  }
}

function normalizeGallerySnapshotResponse(
  response: GallerySnapshotResponse,
  requestedSources: readonly WalletGallerySource[]
): WalletGallerySnapshot {
  const wallets = normalizeWallets(response.wallets, requestedSources);
  const assets = normalizeSnapshotAssets(response.assets);
  const collections = normalizeSnapshotCollections(
    response.collections,
    assets
  );

  return {
    snapshotId: response.snapshot_id ?? `api-${Date.now()}`,
    source: response.source ?? "api",
    wallets,
    capturedAt: response.captured_at ?? new Date().toISOString(),
    ...(response.block_number !== undefined
      ? { blockNumber: response.block_number }
      : {}),
    assets,
    collections,
    warnings: response.warnings ?? [],
  };
}

function normalizeWallets(
  wallets: GallerySnapshotResponse["wallets"],
  fallback: readonly WalletGallerySource[]
): readonly WalletGallerySource[] {
  const normalized = wallets
    ?.map((wallet): WalletGallerySource | null => {
      if (!wallet.kind || !wallet.normalized) {
        return null;
      }

      return {
        kind: wallet.kind,
        input: wallet.input ?? wallet.normalized,
        normalized: wallet.normalized,
      };
    })
    .filter((wallet): wallet is WalletGallerySource => !!wallet);

  return normalized?.length ? normalized : fallback;
}

function normalizeSnapshotAssets(
  assets: GallerySnapshotResponse["assets"]
): readonly WalletGallerySnapshotAsset[] {
  return (
    assets
      ?.map((asset): WalletGallerySnapshotAsset | null => {
        if (
          !asset.id ||
          !asset.title ||
          !asset.collection_id ||
          !asset.collection_name ||
          !asset.contract ||
          !asset.token_id ||
          !asset.owner
        ) {
          return null;
        }

        return {
          id: asset.id,
          title: asset.title,
          collectionId: asset.collection_id,
          collectionName: asset.collection_name,
          contract: asset.contract,
          tokenId: asset.token_id,
          chainId: asset.chain_id ?? 1,
          owner: asset.owner,
          ...(asset.image_uri ? { imageUri: asset.image_uri } : {}),
          ...(asset.mime_type ? { mimeType: asset.mime_type } : {}),
          ...(asset.width ? { width: asset.width } : {}),
          ...(asset.height ? { height: asset.height } : {}),
          ...(asset.metadata_uri ? { metadataUri: asset.metadata_uri } : {}),
          mediaState:
            asset.media_state ?? (asset.image_uri ? "ready" : "partial"),
          altText: asset.alt_text ?? asset.title,
        };
      })
      .filter((asset): asset is WalletGallerySnapshotAsset => !!asset) ?? []
  );
}

function normalizeSnapshotCollections(
  collections: GallerySnapshotResponse["collections"],
  assets: readonly WalletGallerySnapshotAsset[]
): readonly WalletGallerySnapshotCollection[] {
  const normalized =
    collections
      ?.map((collection): WalletGallerySnapshotCollection | null => {
        if (
          !collection.id ||
          !collection.name ||
          !collection.slug ||
          !collection.contract
        ) {
          return null;
        }

        return {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          contract: collection.contract,
          chainId: collection.chain_id ?? 1,
          assetIds: collection.asset_ids ?? [],
        };
      })
      .filter(
        (collection): collection is WalletGallerySnapshotCollection =>
          !!collection
      ) ?? [];

  if (normalized.length) {
    return normalized;
  }

  const byCollection = new Map<string, WalletGallerySnapshotAsset[]>();
  assets.forEach((asset) => {
    const current = byCollection.get(asset.collectionId) ?? [];
    byCollection.set(asset.collectionId, [...current, asset]);
  });

  return [...byCollection.entries()].map(([collectionId, collectionAssets]) => {
    const firstAsset = collectionAssets[0];
    return {
      id: collectionId,
      name: firstAsset?.collectionName ?? "Collection",
      slug: collectionId.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      contract:
        firstAsset?.contract ?? "0x0000000000000000000000000000000000000000",
      chainId: firstAsset?.chainId ?? 1,
      assetIds: collectionAssets.map((asset) => asset.id),
    };
  });
}
