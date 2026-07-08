"use client";

import { useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import {
  ProfileCmsAgentPanel,
  downloadJsonFile,
} from "@/components/profile-cms-builder/ProfileCmsAgentPanel";
import {
  BuilderActionButton,
  TabButton,
} from "@/components/profile-cms-builder/ProfileCmsBuilderControls";
import {
  EditorPanel,
  type GallerySnapshotStatus,
} from "@/components/profile-cms-builder/ProfileCmsBuilderEditorPanel";
import { JsonPanel } from "@/components/profile-cms-builder/ProfileCmsBuilderJsonPanel";
import {
  PublishStatePanel,
  ValidationPanel,
  getExpectedBuilderEndpoint,
} from "@/components/profile-cms-builder/ProfileCmsBuilderStatusPanels";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  createCmsBuilderSchemaBundle,
  createCmsBuilderSourcePacket,
} from "@/lib/profile-cms/builder/agent";
import {
  requestProfileCmsGallerySnapshot,
  runProfileCmsBuilderAction,
  type ProfileCmsBuilderAction,
  type ProfileCmsBuilderActionResult,
} from "@/lib/profile-cms/builder/api";
import {
  parseWalletGallerySources,
  type WalletGalleryBuilderState,
} from "@/lib/profile-cms/builder/gallery";
import {
  createBuilderBlock,
  createBuilderStateFromPackage,
  createDefaultCmsBuilderState,
  parseCmsPackageCandidateJson,
  validateCmsBuilderState,
  type CmsBuilderBlock,
  type CmsBuilderBlockKind,
  type CmsBuilderState,
  type CmsBuilderTemplate,
} from "@/lib/profile-cms/builder/package";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

type BuilderTab = "editor" | "preview" | "json" | "agent";
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
  const [draftVersion, setDraftVersion] = useState(0);
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
  const sourcePacket = useMemo(
    () =>
      createCmsBuilderSourcePacket({
        canUseBuilderApi,
        cmsPackage: validation.cmsPackage,
        draftId,
        draftVersion,
        profileId,
        validation: validation.result,
      }),
    [
      canUseBuilderApi,
      draftId,
      draftVersion,
      profileId,
      validation.cmsPackage,
      validation.result,
    ]
  );
  const schemaBundle = useMemo(() => createCmsBuilderSchemaBundle(), []);
  const clearActionResult = () => {
    const nextDraftVersion = stateVersionRef.current + 1;
    stateVersionRef.current = nextDraftVersion;
    setDraftVersion(nextDraftVersion);
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

  const applyAgentPackage = (cmsPackage: CmsPackageV1) => {
    setState(createBuilderStateFromPackage(cmsPackage));
    clearActionResult();
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
            <TabButton
              active={activeTab === "agent"}
              label={t(locale, "profileCms.builder.tab.agent")}
              onClick={() => setActiveTab("agent")}
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
              onDownloadPackage={() =>
                downloadJsonFile(
                  `${state.handle}-cms-package.json`,
                  validation.cmsPackage
                )
              }
              onDownloadSchemaBundle={() =>
                downloadJsonFile(
                  `${state.handle}-cms-schema-bundle.json`,
                  schemaBundle
                )
              }
              onDownloadSourcePacket={() =>
                downloadJsonFile(
                  `${state.handle}-cms-source-packet.json`,
                  sourcePacket
                )
              }
              importError={importError}
              jsonDraft={jsonDraft || packageJson}
              locale={locale}
              onChange={setJsonDraft}
              onImport={importJson}
            />
          ) : null}

          {activeTab === "agent" ? (
            <ProfileCmsAgentPanel
              canUseBuilderApi={canUseBuilderApi}
              currentDraftVersion={draftVersion}
              draftId={draftId}
              locale={locale}
              onApplyPackage={applyAgentPackage}
              profileId={profileId}
              validation={validation}
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
