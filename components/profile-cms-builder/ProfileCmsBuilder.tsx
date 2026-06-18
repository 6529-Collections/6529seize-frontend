"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth/Auth";
import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT,
  PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT,
  PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT,
  requestProfileCmsGallerySnapshot,
  runProfileCmsBuilderAction,
  type ProfileCmsBuilderAction,
  type ProfileCmsBuilderActionCode,
  type ProfileCmsBuilderActionResult,
} from "@/lib/profile-cms/builder/api";
import {
  WALLET_GALLERY_FIXTURE_WARNING_CODES,
  parseWalletGallerySources,
  type WalletGalleryBuilderState,
  type WalletGallerySnapshotAsset,
  type WalletGallerySnapshotCollection,
} from "@/lib/profile-cms/builder/gallery";
import {
  createBuilderBlock,
  createBuilderStateFromPackage,
  createDefaultCmsBuilderState,
  getBuilderFieldIdForIssuePath,
  parseCmsPackageCandidateJson,
  validateCmsBuilderState,
  type CmsBuilderBlock,
  type CmsBuilderBlockKind,
  type CmsBuilderState,
  type CmsBuilderTemplate,
} from "@/lib/profile-cms/builder/package";
import type { CmsValidationIssueV1 } from "@/lib/profile-cms/protocol/v1";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";

type BuilderTab = "editor" | "preview" | "json";
type GallerySnapshotStatus = "idle" | "loading" | "ready" | "error";

const BLOCK_OPTIONS: ReadonlyArray<{
  readonly kind: CmsBuilderBlockKind;
  readonly labelKey: Parameters<typeof t>[1];
}> = [
  { kind: "heading", labelKey: "profileCms.builder.block.heading" },
  { kind: "rich_text", labelKey: "profileCms.builder.block.richText" },
  { kind: "button_link", labelKey: "profileCms.builder.block.buttonLink" },
  { kind: "image", labelKey: "profileCms.builder.block.image" },
  { kind: "callout", labelKey: "profileCms.builder.block.callout" },
  { kind: "quote", labelKey: "profileCms.builder.block.quote" },
];

export default function ProfileCmsBuilder({
  handle,
  locale = DEFAULT_LOCALE,
  profileId,
  title,
}: {
  readonly handle: string;
  readonly locale?: SupportedLocale | undefined;
  readonly profileId?: string | undefined;
  readonly title: string;
}) {
  const [state, setState] = useState<CmsBuilderState>(() =>
    createDefaultCmsBuilderState(handle)
  );
  const [activeTab, setActiveTab] = useState<BuilderTab>("editor");
  const [jsonDraft, setJsonDraft] = useState("");
  const [importError, setImportError] = useState("");
  const [actionResult, setActionResult] =
    useState<ProfileCmsBuilderActionResult | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gallerySnapshotStatus, setGallerySnapshotStatus] =
    useState<GallerySnapshotStatus>("idle");
  const [gallerySnapshotError, setGallerySnapshotError] = useState("");
  const actionRequestIdRef = useRef(0);
  const gallerySnapshotRequestIdRef = useRef(0);
  const stateVersionRef = useRef(0);
  const { activeProfileProxy, connectedProfile } = useAuth();

  const validation = useMemo(() => validateCmsBuilderState(state), [state]);
  const packageJson = useMemo(
    () => JSON.stringify(validation.cmsPackage, null, 2),
    [validation.cmsPackage]
  );
  const canUseBuilderApi =
    !!profileId && connectedProfile?.id === profileId && !activeProfileProxy;

  const clearActionResult = () => {
    stateVersionRef.current += 1;
    setActionResult(null);
  };

  const updateState = (patch: Partial<CmsBuilderState>) => {
    setState((current) => ({ ...current, ...patch }));
    clearActionResult();
  };

  const selectTemplate = (template: CmsBuilderTemplate) => {
    setState((current) => {
      if (current.template === template) {
        return current;
      }

      return {
        ...current,
        template,
        ...(template === "wallet_gallery"
          ? {
              siteTitle: current.siteTitle.endsWith("Gallery")
                ? current.siteTitle
                : `${current.handle} Gallery`,
              siteDescription:
                current.siteDescription ||
                "Generated gallery from reviewed wallet snapshot.",
              themeAccent: "#00a86b",
            }
          : {}),
      };
    });
    clearActionResult();
  };

  const updateGallery = (patch: Partial<WalletGalleryBuilderState>) => {
    setState((current) => ({
      ...current,
      template: "wallet_gallery",
      gallery: {
        ...current.gallery,
        ...patch,
      },
    }));
    clearActionResult();
  };

  const updateBlock = (index: number, patch: Partial<CmsBuilderBlock>) => {
    setState((current) => ({
      ...current,
      blocks: current.blocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...patch } : block
      ),
    }));
    clearActionResult();
  };

  const requestGallerySnapshot = async () => {
    const parsed = parseWalletGallerySources(state.gallery.walletInput);
    if (!parsed.ok) {
      setGallerySnapshotStatus("error");
      setGallerySnapshotError(
        parsed.errors.includes("missing_wallet")
          ? t(locale, "profileCms.builder.gallery.wallets.emptyError")
          : t(locale, "profileCms.builder.gallery.wallets.invalidError", {
              entries: parsed.errors.join(", "),
            })
      );
      return;
    }

    const requestId = gallerySnapshotRequestIdRef.current + 1;
    gallerySnapshotRequestIdRef.current = requestId;
    setGallerySnapshotStatus("loading");
    setGallerySnapshotError("");
    clearActionResult();

    try {
      const snapshot = await requestProfileCmsGallerySnapshot({
        handle: state.handle,
        profileId: canUseBuilderApi ? profileId : undefined,
        sources: parsed.sources,
      });
      if (requestId !== gallerySnapshotRequestIdRef.current) {
        return;
      }

      setState((current) => ({
        ...current,
        template: "wallet_gallery",
        siteTitle: current.siteTitle.endsWith("Gallery")
          ? current.siteTitle
          : `${current.handle} Gallery`,
        siteDescription:
          current.siteDescription ||
          "Generated gallery from reviewed wallet snapshot.",
        gallery: {
          ...current.gallery,
          snapshot,
          hiddenAssetIds: [],
          featuredAssetIds: snapshot.assets[0] ? [snapshot.assets[0].id] : [],
          featuredCollectionIds: snapshot.collections[0]
            ? [snapshot.collections[0].id]
            : [],
          orderedAssetIds: snapshot.assets.map((asset) => asset.id),
        },
      }));
      stateVersionRef.current += 1;
      setGallerySnapshotStatus("ready");
    } catch {
      if (requestId !== gallerySnapshotRequestIdRef.current) {
        return;
      }
      setGallerySnapshotStatus("error");
      setGallerySnapshotError(
        t(locale, "profileCms.builder.gallery.snapshot.failed")
      );
    }
  };

  const addBlock = (kind: CmsBuilderBlockKind) => {
    setState((current) => ({
      ...current,
      blocks: [
        ...current.blocks,
        createBuilderBlock(kind, current.blocks.length),
      ],
    }));
    clearActionResult();
  };

  const removeBlock = (index: number) => {
    setState((current) => ({
      ...current,
      blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
    clearActionResult();
  };

  const importJson = () => {
    setImportError("");
    try {
      const importedPackage = parseCmsPackageCandidateJson(
        jsonDraft || packageJson
      );
      setState(createBuilderStateFromPackage(importedPackage));
      clearActionResult();
      setActiveTab("editor");
    } catch {
      setImportError(t(locale, "profileCms.builder.json.importFailed"));
    }
  };

  const runAction = async (action: ProfileCmsBuilderAction) => {
    if (!canUseBuilderApi) {
      setActionResult({
        ok: false,
        action,
        expectedEndpoint: getExpectedBuilderEndpoint(action, draftId),
        code: "profile_not_authorized",
      });
      return;
    }

    const actionRequestId = actionRequestIdRef.current + 1;
    actionRequestIdRef.current = actionRequestId;
    const stateVersion = stateVersionRef.current;
    setIsSubmitting(true);
    setActionResult(null);
    try {
      const result = await runProfileCmsBuilderAction({
        action,
        cmsPackage: validation.cmsPackage,
        draftId,
        profileId: canUseBuilderApi ? profileId : undefined,
      });
      if (
        actionRequestId !== actionRequestIdRef.current ||
        stateVersion !== stateVersionRef.current
      ) {
        return;
      }
      if (result.ok && result.draftId) {
        setDraftId(result.draftId);
      }
      setActionResult(result);
    } catch {
      if (
        actionRequestId !== actionRequestIdRef.current ||
        stateVersion !== stateVersionRef.current
      ) {
        return;
      }
      setActionResult({
        ok: false,
        action,
        expectedEndpoint: "profile-cms/packages",
        code: "request_failed",
      });
    } finally {
      if (actionRequestId === actionRequestIdRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <main className="tailwind-scope tw-min-h-[100dvh] tw-bg-iron-950 tw-text-iron-100">
      <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-black">
        <div className="tw-mx-auto tw-flex tw-max-w-7xl tw-flex-col tw-gap-4 tw-px-4 tw-py-5 sm:tw-px-6 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between lg:tw-px-8">
          <div>
            <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
              {state.handle}
            </p>
            <h1 className="tw-text-2xl tw-font-semibold tw-text-white">
              {title}
            </h1>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <BuilderActionButton
              disabled={isSubmitting}
              label={t(locale, "profileCms.builder.cta.saveDraft")}
              onClick={() => void runAction("save_draft")}
            />
            <BuilderActionButton
              disabled={isSubmitting}
              label={t(locale, "profileCms.builder.cta.serverValidate")}
              onClick={() => void runAction("validate")}
            />
            <BuilderActionButton
              disabled={isSubmitting || !validation.result.valid}
              label={t(locale, "profileCms.builder.cta.publish")}
              onClick={() => void runAction("publish")}
              variant="primary"
            />
          </div>
        </div>
      </header>

      <div className="tw-mx-auto tw-grid tw-max-w-7xl tw-grid-cols-1 tw-gap-5 tw-px-4 tw-py-5 sm:tw-px-6 lg:tw-grid-cols-[minmax(0,1fr)_380px] lg:tw-px-8">
        <section
          aria-label={t(locale, "profileCms.builder.workspaceLabel")}
          className="tw-min-w-0 tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900"
        >
          <div className="tw-flex tw-flex-wrap tw-gap-1 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-black tw-p-2">
            <TabButton
              active={activeTab === "editor"}
              label={t(locale, "profileCms.builder.tab.editor")}
              onClick={() => setActiveTab("editor")}
            />
            <TabButton
              active={activeTab === "preview"}
              label={t(locale, "profileCms.builder.tab.preview")}
              onClick={() => setActiveTab("preview")}
            />
            <TabButton
              active={activeTab === "json"}
              label={t(locale, "profileCms.builder.tab.json")}
              onClick={() => {
                setJsonDraft(packageJson);
                setActiveTab("json");
              }}
            />
          </div>

          {activeTab === "editor" ? (
            <EditorPanel
              addBlock={addBlock}
              gallerySnapshotError={gallerySnapshotError}
              gallerySnapshotStatus={gallerySnapshotStatus}
              locale={locale}
              onRequestGallerySnapshot={() => void requestGallerySnapshot()}
              removeBlock={removeBlock}
              selectTemplate={selectTemplate}
              state={state}
              updateBlock={updateBlock}
              updateGallery={updateGallery}
              updateState={updateState}
            />
          ) : null}

          {activeTab === "preview" ? (
            <div className="tw-bg-black">
              <CmsSiteRenderer
                cmsPackage={validation.cmsPackage}
                locale={locale}
                page={validation.page}
              />
            </div>
          ) : null}

          {activeTab === "json" ? (
            <JsonPanel
              importError={importError}
              jsonDraft={jsonDraft || packageJson}
              locale={locale}
              onChange={setJsonDraft}
              onImport={importJson}
            />
          ) : null}
        </section>

        <aside className="tw-flex tw-flex-col tw-gap-5">
          <ValidationPanel
            issues={validation.result.issues}
            locale={locale}
            valid={validation.result.valid}
          />
          <PublishStatePanel
            actionResult={actionResult}
            draftId={draftId}
            locale={locale}
            packageHash={validation.cmsPackage.integrity.package_hash}
            payloadHash={validation.cmsPackage.integrity.payload_hash}
          />
        </aside>
      </div>
    </main>
  );
}

function EditorPanel({
  addBlock,
  gallerySnapshotError,
  gallerySnapshotStatus,
  locale,
  onRequestGallerySnapshot,
  removeBlock,
  selectTemplate,
  state,
  updateBlock,
  updateGallery,
  updateState,
}: {
  readonly addBlock: (kind: CmsBuilderBlockKind) => void;
  readonly gallerySnapshotError: string;
  readonly gallerySnapshotStatus: GallerySnapshotStatus;
  readonly locale: SupportedLocale;
  readonly onRequestGallerySnapshot: () => void;
  readonly removeBlock: (index: number) => void;
  readonly selectTemplate: (template: CmsBuilderTemplate) => void;
  readonly state: CmsBuilderState;
  readonly updateBlock: (
    index: number,
    patch: Partial<CmsBuilderBlock>
  ) => void;
  readonly updateGallery: (patch: Partial<WalletGalleryBuilderState>) => void;
  readonly updateState: (patch: Partial<CmsBuilderState>) => void;
}) {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-0 xl:tw-grid-cols-[280px_minmax(0,1fr)]">
      <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 xl:tw-border-b-0 xl:tw-border-r">
        <h2 className="tw-mb-3 tw-text-sm tw-font-semibold tw-uppercase tw-text-iron-300">
          {t(locale, "profileCms.builder.templates.title")}
        </h2>
        <div className="tw-flex tw-flex-col tw-gap-2">
          <button
            aria-pressed={state.template === "homepage"}
            className={`tw-border tw-border-solid tw-p-3 tw-text-left tw-text-sm tw-font-semibold ${
              state.template === "homepage"
                ? "tw-border-primary-400 tw-bg-primary-500/10 tw-text-white"
                : "tw-border-iron-800 tw-bg-black tw-text-iron-300 hover:tw-border-primary-400"
            }`}
            onClick={() => selectTemplate("homepage")}
            type="button"
          >
            {t(locale, "profileCms.builder.templates.homepage")}
          </button>
          <button
            aria-pressed={state.template === "wallet_gallery"}
            className={`tw-border tw-border-solid tw-p-3 tw-text-left tw-text-sm tw-font-semibold ${
              state.template === "wallet_gallery"
                ? "tw-border-primary-400 tw-bg-primary-500/10 tw-text-white"
                : "tw-border-iron-800 tw-bg-black tw-text-iron-300 hover:tw-border-primary-400"
            }`}
            onClick={() => selectTemplate("wallet_gallery")}
            type="button"
          >
            {t(locale, "profileCms.builder.templates.walletGallery")}
          </button>
          <button
            aria-disabled="true"
            className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3 tw-text-left tw-text-sm tw-text-iron-500"
            disabled
            type="button"
          >
            {t(locale, "profileCms.builder.templates.gallery")}{" "}
            {t(locale, "profileCms.builder.templates.status.comingSoon")}
          </button>
        </div>
      </div>

      {state.template === "wallet_gallery" ? (
        <WalletGalleryPanel
          gallery={state.gallery}
          locale={locale}
          onRequestSnapshot={onRequestGallerySnapshot}
          snapshotError={gallerySnapshotError}
          snapshotStatus={gallerySnapshotStatus}
          updateGallery={updateGallery}
          updateState={updateState}
          state={state}
        />
      ) : (
        <div className="tw-flex tw-flex-col tw-gap-6 tw-p-4">
          <Fieldset title={t(locale, "profileCms.builder.siteSettings")}>
            <TextInput
              id="cms-builder-site-title"
              label={t(locale, "profileCms.builder.field.siteTitle")}
              onChange={(siteTitle) => updateState({ siteTitle })}
              value={state.siteTitle}
            />
            <TextArea
              id="cms-builder-site-description"
              label={t(locale, "profileCms.builder.field.siteDescription")}
              onChange={(siteDescription) => updateState({ siteDescription })}
              rows={3}
              value={state.siteDescription}
            />
            <TextInput
              id="cms-builder-theme-accent"
              label={t(locale, "profileCms.builder.field.themeAccent")}
              onChange={(themeAccent) => updateState({ themeAccent })}
              type="color"
              value={state.themeAccent}
            />
          </Fieldset>

          <Fieldset title={t(locale, "profileCms.builder.pageSettings")}>
            <TextInput
              id="cms-builder-page-title"
              label={t(locale, "profileCms.builder.field.pageTitle")}
              onChange={(pageTitle) => updateState({ pageTitle })}
              value={state.pageTitle}
            />
            <TextArea
              id="cms-builder-page-description"
              label={t(locale, "profileCms.builder.field.pageDescription")}
              onChange={(pageDescription) => updateState({ pageDescription })}
              rows={3}
              value={state.pageDescription}
            />
            <TextInput
              id="cms-builder-social-image"
              label={t(locale, "profileCms.builder.field.socialImageAsset")}
              onChange={(socialImageAssetId) =>
                updateState({ socialImageAssetId })
              }
              placeholder="asset-image-1"
              value={state.socialImageAssetId}
            />
            <TextInput
              id="cms-builder-navigation-label"
              label={t(locale, "profileCms.builder.field.navigationLabel")}
              onChange={(navigationLabel) => updateState({ navigationLabel })}
              value={state.navigationLabel}
            />
          </Fieldset>

          <Fieldset title={t(locale, "profileCms.builder.blocks.title")}>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {BLOCK_OPTIONS.map((option) => (
                <button
                  className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 hover:tw-border-primary-400"
                  key={option.kind}
                  onClick={() => addBlock(option.kind)}
                  type="button"
                >
                  {t(locale, option.labelKey)}
                </button>
              ))}
            </div>
            <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4">
              {state.blocks.map((block, index) => (
                <BlockEditor
                  block={block}
                  index={index}
                  key={block.id}
                  locale={locale}
                  onChange={(patch) => updateBlock(index, patch)}
                  onRemove={() => removeBlock(index)}
                />
              ))}
            </div>
          </Fieldset>
        </div>
      )}
    </div>
  );
}

function WalletGalleryPanel({
  gallery,
  locale,
  onRequestSnapshot,
  snapshotError,
  snapshotStatus,
  state,
  updateGallery,
  updateState,
}: {
  readonly gallery: WalletGalleryBuilderState;
  readonly locale: SupportedLocale;
  readonly onRequestSnapshot: () => void;
  readonly snapshotError: string;
  readonly snapshotStatus: GallerySnapshotStatus;
  readonly state: CmsBuilderState;
  readonly updateGallery: (patch: Partial<WalletGalleryBuilderState>) => void;
  readonly updateState: (patch: Partial<CmsBuilderState>) => void;
}) {
  const snapshot = gallery.snapshot;
  const orderedAssets = snapshot
    ? orderGalleryAssets(snapshot.assets, gallery.orderedAssetIds)
    : [];
  const hiddenAssetIds = new Set(gallery.hiddenAssetIds);
  const visibleAssets = orderedAssets.filter(
    (asset) => !hiddenAssetIds.has(asset.id)
  );
  const partialMediaCount = orderedAssets.filter(
    (asset) => asset.mediaState !== "ready" || !asset.imageUri
  ).length;

  const toggleHiddenAsset = (assetId: string) => {
    updateGallery({
      hiddenAssetIds: toggleString(gallery.hiddenAssetIds, assetId),
    });
  };
  const toggleFeaturedAsset = (assetId: string) => {
    updateGallery({
      featuredAssetIds: toggleString(gallery.featuredAssetIds, assetId),
    });
  };
  const toggleFeaturedCollection = (collectionId: string) => {
    updateGallery({
      featuredCollectionIds: toggleString(
        gallery.featuredCollectionIds,
        collectionId
      ),
    });
  };
  const moveAsset = (assetId: string, direction: -1 | 1) => {
    const currentOrder =
      gallery.orderedAssetIds.length > 0
        ? gallery.orderedAssetIds
        : orderedAssets.map((asset) => asset.id);
    updateGallery({
      orderedAssetIds: moveString(currentOrder, assetId, direction),
    });
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-6 tw-p-4">
      <Fieldset title={t(locale, "profileCms.builder.gallery.settings")}>
        <TextInput
          id="cms-builder-gallery-site-title"
          label={t(locale, "profileCms.builder.field.siteTitle")}
          onChange={(siteTitle) => updateState({ siteTitle })}
          value={state.siteTitle}
        />
        <TextInput
          id="cms-builder-gallery-theme-accent"
          label={t(locale, "profileCms.builder.field.themeAccent")}
          onChange={(themeAccent) => updateState({ themeAccent })}
          type="color"
          value={state.themeAccent}
        />
        <TextArea
          id="cms-builder-gallery-site-description"
          label={t(locale, "profileCms.builder.field.siteDescription")}
          onChange={(siteDescription) => updateState({ siteDescription })}
          rows={3}
          value={state.siteDescription}
        />
      </Fieldset>

      <Fieldset title={t(locale, "profileCms.builder.gallery.wallets.title")}>
        <TextArea
          id="cms-builder-gallery-wallets"
          label={t(locale, "profileCms.builder.gallery.wallets.label")}
          onChange={(walletInput) => updateGallery({ walletInput })}
          rows={5}
          value={gallery.walletInput}
        />
        <div className="tw-flex tw-flex-col tw-gap-2 md:tw-col-span-2">
          <div>
            <BuilderActionButton
              disabled={snapshotStatus === "loading"}
              label={
                snapshotStatus === "loading"
                  ? t(locale, "profileCms.builder.gallery.snapshot.loading")
                  : t(locale, "profileCms.builder.gallery.snapshot.request")
              }
              onClick={onRequestSnapshot}
              variant="primary"
            />
          </div>
          <p className="tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "profileCms.builder.gallery.wallets.help")}
          </p>
          {snapshotStatus === "loading" ? (
            <p className="tw-text-primary-200 tw-text-sm" role="status">
              {t(locale, "profileCms.builder.gallery.snapshot.loadingDetail")}
            </p>
          ) : null}
          {snapshotError ? (
            <p
              className="tw-border tw-border-solid tw-border-red tw-bg-red/10 tw-p-3 tw-text-sm tw-text-red"
              role="alert"
            >
              {snapshotError}
            </p>
          ) : null}
        </div>
      </Fieldset>

      <section
        aria-labelledby="cms-builder-gallery-review-title"
        className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4"
      >
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
          <div>
            <h2
              className="tw-text-base tw-font-semibold tw-text-white"
              id="cms-builder-gallery-review-title"
            >
              {t(locale, "profileCms.builder.gallery.review.title")}
            </h2>
            <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "profileCms.builder.gallery.review.description")}
            </p>
          </div>
          {snapshot ? (
            <p className="tw-text-primary-200 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold">
              {snapshot.source === "fixture"
                ? t(locale, "profileCms.builder.gallery.snapshot.fixture")
                : t(locale, "profileCms.builder.gallery.snapshot.api")}
            </p>
          ) : null}
        </div>

        {!snapshot ? (
          <EmptyGalleryReview locale={locale} />
        ) : (
          <div className="tw-mt-5 tw-flex tw-flex-col tw-gap-5">
            <GallerySnapshotSummary
              hiddenCount={gallery.hiddenAssetIds.length}
              locale={locale}
              partialMediaCount={partialMediaCount}
              snapshot={snapshot}
              visibleCount={visibleAssets.length}
            />
            <GalleryCollectionReviewList
              collections={snapshot.collections}
              featuredCollectionIds={gallery.featuredCollectionIds}
              locale={locale}
              onToggleFeatured={toggleFeaturedCollection}
              visibleAssets={visibleAssets}
            />
            <GalleryAssetReviewList
              assets={orderedAssets}
              featuredAssetIds={gallery.featuredAssetIds}
              hiddenAssetIds={gallery.hiddenAssetIds}
              locale={locale}
              onMoveAsset={moveAsset}
              onToggleFeatured={toggleFeaturedAsset}
              onToggleHidden={toggleHiddenAsset}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyGalleryReview({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-mt-5 tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-300">
      {t(locale, "profileCms.builder.gallery.review.empty")}
    </div>
  );
}

function GallerySnapshotSummary({
  hiddenCount,
  locale,
  partialMediaCount,
  snapshot,
  visibleCount,
}: {
  readonly hiddenCount: number;
  readonly locale: SupportedLocale;
  readonly partialMediaCount: number;
  readonly snapshot: NonNullable<WalletGalleryBuilderState["snapshot"]>;
  readonly visibleCount: number;
}) {
  return (
    <div className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4">
      <dl className="tw-grid tw-grid-cols-1 tw-gap-3 tw-text-sm sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        <SummaryItem
          label={t(locale, "profileCms.builder.gallery.summary.wallets")}
          value={formatInteger(locale, snapshot.wallets.length)}
        />
        <SummaryItem
          label={t(locale, "profileCms.builder.gallery.summary.visible")}
          value={formatInteger(locale, visibleCount)}
        />
        <SummaryItem
          label={t(locale, "profileCms.builder.gallery.summary.hidden")}
          value={formatInteger(locale, hiddenCount)}
        />
        <SummaryItem
          label={t(locale, "profileCms.builder.gallery.summary.partial")}
          value={formatInteger(locale, partialMediaCount)}
        />
      </dl>
      {snapshot.warnings.length ? (
        <ul className="tw-mt-4 tw-flex tw-flex-col tw-gap-2">
          {snapshot.warnings.map((warning) => (
            <li
              className="tw-text-primary-100 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-p-3 tw-text-sm tw-leading-6"
              key={warning}
            >
              {formatGallerySnapshotWarning(locale, warning)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function formatGallerySnapshotWarning(
  locale: SupportedLocale,
  warning: string
): string {
  switch (warning) {
    case WALLET_GALLERY_FIXTURE_WARNING_CODES.backendDisabled:
      return t(
        locale,
        "profileCms.builder.gallery.snapshot.warning.fixtureBackendDisabled"
      );
    case WALLET_GALLERY_FIXTURE_WARNING_CODES.partialMedia:
      return t(
        locale,
        "profileCms.builder.gallery.snapshot.warning.partialMedia"
      );
    default:
      return warning;
  }
}

function SummaryItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <dt className="tw-text-iron-500">{label}</dt>
      <dd className="tw-mt-1 tw-text-lg tw-font-semibold tw-text-white">
        {value}
      </dd>
    </div>
  );
}

function GalleryCollectionReviewList({
  collections,
  featuredCollectionIds,
  locale,
  onToggleFeatured,
  visibleAssets,
}: {
  readonly collections: readonly WalletGallerySnapshotCollection[];
  readonly featuredCollectionIds: readonly string[];
  readonly locale: SupportedLocale;
  readonly onToggleFeatured: (collectionId: string) => void;
  readonly visibleAssets: readonly WalletGallerySnapshotAsset[];
}) {
  return (
    <section aria-labelledby="cms-builder-gallery-collections-title">
      <h3
        className="tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300"
        id="cms-builder-gallery-collections-title"
      >
        {t(locale, "profileCms.builder.gallery.collections.title")}
      </h3>
      <ul className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
        {collections.map((collection) => {
          const visibleCount = visibleAssets.filter(
            (asset) => asset.collectionId === collection.id
          ).length;
          const featured = featuredCollectionIds.includes(collection.id);
          return (
            <li
              className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
              key={collection.id}
            >
              <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
                <div>
                  <p className="tw-text-sm tw-font-semibold tw-text-white">
                    {collection.name}
                  </p>
                  <p className="tw-mt-1 tw-text-xs tw-text-iron-500">
                    {t(locale, "profileCms.builder.gallery.collections.count", {
                      count: formatInteger(locale, visibleCount),
                    })}
                  </p>
                </div>
                <button
                  aria-pressed={featured}
                  className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400"
                  onClick={() => onToggleFeatured(collection.id)}
                  type="button"
                >
                  {featured
                    ? t(
                        locale,
                        "profileCms.builder.gallery.collections.unfeature"
                      )
                    : t(
                        locale,
                        "profileCms.builder.gallery.collections.feature"
                      )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function GalleryAssetReviewList({
  assets,
  featuredAssetIds,
  hiddenAssetIds,
  locale,
  onMoveAsset,
  onToggleFeatured,
  onToggleHidden,
}: {
  readonly assets: readonly WalletGallerySnapshotAsset[];
  readonly featuredAssetIds: readonly string[];
  readonly hiddenAssetIds: readonly string[];
  readonly locale: SupportedLocale;
  readonly onMoveAsset: (assetId: string, direction: -1 | 1) => void;
  readonly onToggleFeatured: (assetId: string) => void;
  readonly onToggleHidden: (assetId: string) => void;
}) {
  if (!assets.length) {
    return (
      <div className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-300">
        {t(locale, "profileCms.builder.gallery.assets.empty")}
      </div>
    );
  }

  return (
    <section aria-labelledby="cms-builder-gallery-assets-title">
      <h3
        className="tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300"
        id="cms-builder-gallery-assets-title"
      >
        {t(locale, "profileCms.builder.gallery.assets.title")}
      </h3>
      <ul className="tw-mt-3 tw-grid tw-grid-cols-1 tw-gap-3">
        {assets.map((asset, index) => (
          <GalleryAssetReviewCard
            asset={asset}
            canMoveDown={index < assets.length - 1}
            canMoveUp={index > 0}
            featured={featuredAssetIds.includes(asset.id)}
            hidden={hiddenAssetIds.includes(asset.id)}
            key={asset.id}
            locale={locale}
            onMoveAsset={onMoveAsset}
            onToggleFeatured={onToggleFeatured}
            onToggleHidden={onToggleHidden}
          />
        ))}
      </ul>
    </section>
  );
}

function GalleryAssetReviewCard({
  asset,
  canMoveDown,
  canMoveUp,
  featured,
  hidden,
  locale,
  onMoveAsset,
  onToggleFeatured,
  onToggleHidden,
}: {
  readonly asset: WalletGallerySnapshotAsset;
  readonly canMoveDown: boolean;
  readonly canMoveUp: boolean;
  readonly featured: boolean;
  readonly hidden: boolean;
  readonly locale: SupportedLocale;
  readonly onMoveAsset: (assetId: string, direction: -1 | 1) => void;
  readonly onToggleFeatured: (assetId: string) => void;
  readonly onToggleHidden: (assetId: string) => void;
}) {
  const imageUrl = resolveCmsUri(asset.imageUri);
  return (
    <li
      className={`tw-grid tw-grid-cols-1 tw-gap-4 tw-border tw-border-solid tw-p-4 md:tw-grid-cols-[7rem_minmax(0,1fr)] ${
        hidden
          ? "tw-border-iron-800 tw-bg-iron-950 tw-opacity-70"
          : "tw-border-iron-700 tw-bg-black"
      }`}
    >
      <div className="tw-flex tw-min-h-28 tw-items-center tw-justify-center tw-bg-iron-950">
        {imageUrl ? (
          <Image
            alt={asset.altText}
            className="tw-h-28 tw-w-full tw-object-contain"
            height={112}
            src={imageUrl}
            unoptimized
            width={112}
          />
        ) : (
          <div className="tw-p-3 tw-text-center tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(locale, "profileCms.builder.gallery.assets.mediaPartial")}
          </div>
        )}
      </div>
      <div className="tw-min-w-0">
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
          <div>
            <h4 className="tw-text-base tw-font-semibold tw-text-white">
              {asset.title}
            </h4>
            <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
              {asset.collectionName}
            </p>
            <p className="tw-mt-1 tw-break-all tw-text-xs tw-text-iron-500">
              {t(locale, "profileCms.builder.gallery.assets.owner", {
                owner: asset.owner,
              })}
            </p>
          </div>
          <p
            className={`tw-border tw-border-solid tw-px-2 tw-py-1 tw-text-xs tw-font-semibold ${
              asset.mediaState === "ready" && imageUrl
                ? "tw-border-green tw-bg-green/10 tw-text-green"
                : "tw-text-primary-200 tw-border-primary-400 tw-bg-primary-500/10"
            }`}
          >
            {asset.mediaState === "ready" && imageUrl
              ? t(locale, "profileCms.builder.gallery.assets.mediaReady")
              : t(locale, "profileCms.builder.gallery.assets.mediaPartial")}
          </p>
        </div>
        <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
          <button
            aria-pressed={hidden}
            className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400"
            onClick={() => onToggleHidden(asset.id)}
            type="button"
          >
            {hidden
              ? t(locale, "profileCms.builder.gallery.assets.unhide")
              : t(locale, "profileCms.builder.gallery.assets.hide")}
          </button>
          <button
            aria-pressed={featured}
            className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400"
            onClick={() => onToggleFeatured(asset.id)}
            type="button"
          >
            {featured
              ? t(locale, "profileCms.builder.gallery.assets.unfeature")
              : t(locale, "profileCms.builder.gallery.assets.feature")}
          </button>
          <button
            className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            disabled={!canMoveUp}
            onClick={() => onMoveAsset(asset.id, -1)}
            type="button"
          >
            {t(locale, "profileCms.builder.gallery.assets.moveUp")}
          </button>
          <button
            className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            disabled={!canMoveDown}
            onClick={() => onMoveAsset(asset.id, 1)}
            type="button"
          >
            {t(locale, "profileCms.builder.gallery.assets.moveDown")}
          </button>
        </div>
      </div>
    </li>
  );
}

function orderGalleryAssets(
  assets: readonly WalletGallerySnapshotAsset[],
  orderedAssetIds: readonly string[]
): readonly WalletGallerySnapshotAsset[] {
  if (!orderedAssetIds.length) {
    return assets;
  }

  const position = new Map(orderedAssetIds.map((id, index) => [id, index]));
  return [...assets].sort((left, right) => {
    const leftPosition = position.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightPosition = position.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }
    return assets.indexOf(left) - assets.indexOf(right);
  });
}

function toggleString(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function moveString(
  values: readonly string[],
  value: string,
  direction: -1 | 1
): string[] {
  const next = [...values];
  const currentIndex = next.indexOf(value);
  if (currentIndex < 0) {
    return next;
  }

  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= next.length) {
    return next;
  }

  const [item] = next.splice(currentIndex, 1);
  if (!item) {
    return next;
  }
  next.splice(targetIndex, 0, item);
  return next;
}

function BlockEditor({
  block,
  index,
  locale,
  onChange,
  onRemove,
}: {
  readonly block: CmsBuilderBlock;
  readonly index: number;
  readonly locale: SupportedLocale;
  readonly onChange: (patch: Partial<CmsBuilderBlock>) => void;
  readonly onRemove: () => void;
}) {
  const fieldId = `cms-builder-block-${index}`;
  const blockLabelKey = getBlockLabelKey(block.kind);
  return (
    <section
      aria-labelledby={`${fieldId}-title`}
      className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4"
      id={fieldId}
    >
      <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h3
          className="tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300"
          id={`${fieldId}-title`}
        >
          {t(locale, blockLabelKey)}
        </h3>
        <button
          className="tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-200 hover:tw-border-red"
          onClick={onRemove}
          type="button"
        >
          {t(locale, "profileCms.builder.block.remove")}
        </button>
      </div>

      {block.kind === "heading" ? (
        <TextInput
          id={`${fieldId}-text`}
          label={t(locale, "profileCms.builder.block.headingText")}
          onChange={(text) => onChange({ text })}
          value={block.text}
        />
      ) : null}

      {block.kind === "rich_text" ? (
        <TextArea
          id={`${fieldId}-rich-text`}
          label={t(locale, "profileCms.builder.block.body")}
          onChange={(text) => onChange({ text })}
          rows={5}
          value={block.text}
        />
      ) : null}

      {block.kind === "button_link" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <TextInput
            id={`${fieldId}-button-label`}
            label={t(locale, "profileCms.builder.block.buttonLabel")}
            onChange={(text) => onChange({ text })}
            value={block.text}
          />
          <TextInput
            id={`${fieldId}-button-url`}
            label={t(locale, "profileCms.builder.block.buttonUrl")}
            onChange={(url) => onChange({ url })}
            value={block.url}
          />
        </div>
      ) : null}

      {block.kind === "image" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <TextInput
            id={`${fieldId}-image-uri`}
            label={t(locale, "profileCms.builder.block.imageUri")}
            onChange={(assetUri) => onChange({ assetUri })}
            value={block.assetUri}
          />
          <TextInput
            id={`${fieldId}-image-alt`}
            label={t(locale, "profileCms.builder.block.imageAlt")}
            onChange={(altText) => onChange({ altText })}
            value={block.altText}
          />
          <TextInput
            id={`${fieldId}-image-caption`}
            label={t(locale, "profileCms.builder.block.caption")}
            onChange={(title) => onChange({ title })}
            value={block.title}
          />
        </div>
      ) : null}

      {block.kind === "callout" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <TextInput
            id={`${fieldId}-callout-tone`}
            label={t(locale, "profileCms.builder.block.tone")}
            onChange={(tone) => onChange({ tone })}
            value={block.tone}
          />
          <TextInput
            id={`${fieldId}-callout-title`}
            label={t(locale, "profileCms.builder.block.calloutTitle")}
            onChange={(title) => onChange({ title })}
            value={block.title}
          />
          <div className="md:tw-col-span-2">
            <TextArea
              id={`${fieldId}-callout-body`}
              label={t(locale, "profileCms.builder.block.body")}
              onChange={(text) => onChange({ text })}
              rows={4}
              value={block.text}
            />
          </div>
        </div>
      ) : null}

      {block.kind === "quote" ? (
        <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
          <div className="md:tw-col-span-2">
            <TextArea
              id={`${fieldId}-quote`}
              label={t(locale, "profileCms.builder.block.quoteText")}
              onChange={(text) => onChange({ text })}
              rows={4}
              value={block.text}
            />
          </div>
          <TextInput
            id={`${fieldId}-citation`}
            label={t(locale, "profileCms.builder.block.citation")}
            onChange={(citation) => onChange({ citation })}
            value={block.citation}
          />
        </div>
      ) : null}
    </section>
  );
}

function JsonPanel({
  importError,
  jsonDraft,
  locale,
  onChange,
  onImport,
}: {
  readonly importError: string;
  readonly jsonDraft: string;
  readonly locale: SupportedLocale;
  readonly onChange: (value: string) => void;
  readonly onImport: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h2 className="tw-text-lg tw-font-semibold tw-text-white">
          {t(locale, "profileCms.builder.json.title")}
        </h2>
        <button
          className="tw-min-h-10 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-px-3 tw-text-sm tw-font-semibold tw-text-white"
          onClick={onImport}
          type="button"
        >
          {t(locale, "profileCms.builder.json.import")}
        </button>
      </div>
      {importError ? (
        <p className="tw-border tw-border-solid tw-border-red tw-bg-red/10 tw-p-3 tw-text-sm tw-text-red">
          {importError}
        </p>
      ) : null}
      <label
        className="tw-text-sm tw-font-medium tw-text-iron-300"
        htmlFor="cms-builder-json"
      >
        {t(locale, "profileCms.builder.json.label")}
      </label>
      <textarea
        className="tw-min-h-[560px] tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-p-3 tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
        id="cms-builder-json"
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        value={jsonDraft}
      />
    </div>
  );
}

function ValidationPanel({
  issues,
  locale,
  valid,
}: {
  readonly issues: readonly CmsValidationIssueV1[];
  readonly locale: SupportedLocale;
  readonly valid: boolean;
}) {
  return (
    <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <h2 className="tw-text-base tw-font-semibold tw-text-white">
        {t(locale, "profileCms.builder.validation.title")}
      </h2>
      <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
        {valid
          ? t(locale, "profileCms.builder.validation.valid")
          : t(locale, "profileCms.builder.validation.invalid")}
      </p>
      <ul className="tw-mt-4 tw-flex tw-flex-col tw-gap-3">
        {issues.length ? (
          issues.map((issue) => (
            <ValidationIssueItem
              issue={issue}
              key={`${issue.code}-${issue.path}-${issue.message}`}
              locale={locale}
            />
          ))
        ) : (
          <li className="tw-border tw-border-solid tw-border-green tw-bg-green/10 tw-p-3 tw-text-sm tw-text-green">
            {t(locale, "profileCms.builder.validation.noIssues")}
          </li>
        )}
      </ul>
    </section>
  );
}

function ValidationIssueItem({
  issue,
  locale,
}: {
  readonly issue: CmsValidationIssueV1;
  readonly locale: SupportedLocale;
}) {
  const fieldId = getBuilderFieldIdForIssuePath(issue.path);
  return (
    <li className="tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-p-3">
      <p className="tw-text-sm tw-font-semibold tw-text-white">
        {t(locale, getValidationSeverityKey(issue.severity))} · {issue.code}
      </p>
      <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "profileCms.builder.validation.issueDetail")}
      </p>
      <p className="tw-mt-1 tw-font-mono tw-text-xs tw-text-iron-500">
        {issue.path}
      </p>
      {fieldId ? (
        <button
          className="tw-mt-3 tw-min-h-9 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400"
          onClick={() => focusField(fieldId)}
          type="button"
        >
          {t(locale, "profileCms.builder.validation.focusField")}
        </button>
      ) : null}
    </li>
  );
}

function PublishStatePanel({
  actionResult,
  draftId,
  locale,
  packageHash,
  payloadHash,
}: {
  readonly actionResult: ProfileCmsBuilderActionResult | null;
  readonly draftId?: string | undefined;
  readonly locale: SupportedLocale;
  readonly packageHash: string;
  readonly payloadHash: string;
}) {
  return (
    <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <h2 className="tw-text-base tw-font-semibold tw-text-white">
        {t(locale, "profileCms.builder.publishState.title")}
      </h2>
      <dl className="tw-mt-3 tw-flex tw-flex-col tw-gap-3 tw-text-sm">
        <div>
          <dt className="tw-text-iron-500">
            {t(locale, "profileCms.builder.publishState.packageHash")}
          </dt>
          <dd className="tw-break-all tw-font-mono tw-text-iron-200">
            {packageHash}
          </dd>
        </div>
        <div>
          <dt className="tw-text-iron-500">
            {t(locale, "profileCms.builder.publishState.payloadHash")}
          </dt>
          <dd className="tw-break-all tw-font-mono tw-text-iron-200">
            {payloadHash}
          </dd>
        </div>
        <div>
          <dt className="tw-text-iron-500">
            {t(locale, "profileCms.builder.publishState.draftId")}
          </dt>
          <dd className="tw-break-all tw-font-mono tw-text-iron-200">
            {draftId ?? t(locale, "profileCms.builder.publishState.noDraft")}
          </dd>
        </div>
      </dl>
      {actionResult ? (
        <div
          className={`tw-mt-4 tw-border tw-border-solid tw-p-3 tw-text-sm ${
            actionResult.ok
              ? "tw-border-green tw-bg-green/10 tw-text-green"
              : "tw-text-primary-200 tw-border-primary-400 tw-bg-primary-500/10"
          }`}
        >
          <p>{getActionResultMessage(locale, actionResult.code)}</p>
          {actionResult.ok ? null : (
            <p className="tw-mt-2 tw-font-mono tw-text-xs">
              {actionResult.expectedEndpoint}
            </p>
          )}
        </div>
      ) : (
        <p className="tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "profileCms.builder.publishState.pending")}
        </p>
      )}
    </section>
  );
}

function getActionResultMessage(
  locale: SupportedLocale,
  code: ProfileCmsBuilderActionCode
): string {
  switch (code) {
    case "api_disabled":
      return t(locale, "profileCms.builder.api.disabled");
    case "missing_draft_id":
      return t(locale, "profileCms.builder.api.missingDraftId");
    case "missing_profile_id":
      return t(locale, "profileCms.builder.api.missingProfileId");
    case "profile_not_authorized":
      return t(locale, "profileCms.builder.api.profileNotAuthorized");
    case "publish_requires_signed_storage":
      return t(locale, "profileCms.builder.api.publishRequiresSignedStorage");
    case "request_failed":
      return t(locale, "profileCms.builder.api.failed");
    case "server_validation_completed":
      return t(locale, "profileCms.builder.api.serverValidationCompleted");
    case "draft_saved":
      return t(locale, "profileCms.builder.api.draftSaved");
  }
}

function getExpectedBuilderEndpoint(
  action: ProfileCmsBuilderAction,
  draftId: string | undefined
): string {
  switch (action) {
    case "save_draft":
      return PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT;
    case "validate":
      return PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT;
    case "publish":
      return PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT.replace(
        "{id}",
        draftId ? encodeURIComponent(draftId) : ":id"
      );
  }
}

function getBlockLabelKey(
  kind: CmsBuilderBlockKind
): (typeof BLOCK_OPTIONS)[number]["labelKey"] {
  return (
    BLOCK_OPTIONS.find((option) => option.kind === kind)?.labelKey ??
    "profileCms.builder.block.heading"
  );
}

function getValidationSeverityKey(
  severity: CmsValidationIssueV1["severity"]
): Parameters<typeof t>[1] {
  return severity === "warning"
    ? "profileCms.builder.validation.severity.warning"
    : "profileCms.builder.validation.severity.error";
}

function Fieldset({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <fieldset className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-4">
      <legend className="tw-px-2 tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
        {title}
      </legend>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
        {children}
      </div>
    </fieldset>
  );
}

function TextInput({
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string | undefined;
  readonly type?: string | undefined;
  readonly value: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <label
        className="tw-text-sm tw-font-medium tw-text-iron-300"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className="tw-min-h-11 tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-text-white focus:tw-border-primary-400 focus:tw-outline-none"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}

function TextArea({
  id,
  label,
  onChange,
  rows,
  value,
}: {
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly rows: number;
  readonly value: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1 md:tw-col-span-2">
      <label
        className="tw-text-sm tw-font-medium tw-text-iron-300"
        htmlFor={id}
      >
        {label}
      </label>
      <textarea
        className="tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-3 tw-text-sm tw-leading-6 tw-text-white focus:tw-border-primary-400 focus:tw-outline-none"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
      />
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`tw-min-h-10 tw-border tw-border-solid tw-px-3 tw-text-sm tw-font-semibold ${
        active
          ? "tw-border-primary-400 tw-bg-primary-500/10 tw-text-white"
          : "tw-border-transparent tw-bg-transparent tw-text-iron-300 hover:tw-border-iron-700"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function BuilderActionButton({
  disabled,
  label,
  onClick,
  variant = "secondary",
}: {
  readonly disabled: boolean;
  readonly label: string;
  readonly onClick: () => void;
  readonly variant?: "primary" | "secondary" | undefined;
}) {
  return (
    <button
      className={`tw-min-h-10 tw-border tw-border-solid tw-px-3 tw-text-sm tw-font-semibold disabled:tw-cursor-not-allowed disabled:tw-opacity-50 ${
        variant === "primary"
          ? "tw-border-primary-400 tw-bg-primary-500 tw-text-white"
          : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-100 hover:tw-border-primary-400"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function focusField(fieldId: string): void {
  const element = globalThis.document?.getElementById(fieldId);
  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  if ("focus" in element && typeof element.focus === "function") {
    element.focus();
  }
}
