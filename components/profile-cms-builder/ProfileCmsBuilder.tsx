"use client";

import { useMemo, useRef, useState, type ComponentProps } from "react";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
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

import ProfileCmsPublishPanel from "./ProfileCmsPublishPanel";
import ProfileCmsPendingJsonPanel from "./ProfileCmsPendingJsonPanel";
import { refreshWalletGalleryState } from "@/lib/profile-cms/builder/gallery-source";
import ProfileCmsVersionHistoryPanel from "./ProfileCmsVersionHistoryPanel";
import { useCmsDraftRecovery } from "./useCmsDraftRecovery";
import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import {
  canVisuallyEditCmsPackage,
  updateCmsBuilderState,
} from "@/lib/profile-cms/builder/editor";
import { getProfileCmsPackageById } from "@/lib/profile-cms/builder/api";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";

export default function ProfileCmsBuilder(
  props: ComponentProps<typeof ProfileCmsBuilderWorkspace>
) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  return (
    <ProfileCmsBuilderWorkspace
      key={
        (props.profileId ?? props.handle) +
        ":" +
        (connectedProfile?.id ?? "guest") +
        ":" +
        (address?.toLowerCase() ?? "disconnected") +
        ":" +
        (activeProfileProxy ? "proxy" : "owner")
      }
      {...props}
    />
  );
}

type BuilderTab = "editor" | "preview" | "json" | "agent";
function ProfileCmsBuilderWorkspace({
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
  const [jsonDraft, setJsonDraft] = useState<string | null>(null);
  const [importError, setImportError] = useState("");
  const [actionResult, setActionResult] =
    useState<ProfileCmsBuilderActionResult | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [draftVersion, setDraftVersion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [gallerySnapshotStatus, setGallerySnapshotStatus] =
    useState<GallerySnapshotStatus>("idle");
  const [gallerySnapshotError, setGallerySnapshotError] = useState("");
  const actionRequestIdRef = useRef(0);
  const gallerySnapshotRequestIdRef = useRef(0);
  const stateVersionRef = useRef(0);
  const { activeProfileProxy, connectedProfile, isAuthenticated } = useAuth();
  const { address } = useSeizeConnectContext();

  const validation = useMemo(() => validateCmsBuilderState(state), [state]);
  const packageJson = useMemo(
    () => JSON.stringify(validation.cmsPackage, null, 2),
    [validation.cmsPackage]
  );
  const canUseBuilderApi = isCmsBuilderOwner(
    profileId,
    connectedProfile?.id,
    !!activeProfileProxy
  );
  const canRequestGallerySnapshot =
    !isProfileCmsBuilderApiEnabledEnv() || isAuthenticated === true;
  const busy = isCmsBuilderBusy(
    isSubmitting,
    isPublishing,
    gallerySnapshotStatus
  );
  const hasUnappliedJson = hasPendingCmsJson(jsonDraft, packageJson);
  const galleryReady = isCmsGalleryReady(state);
  const recovery = useCmsDraftRecovery({
    scope:
      (profileId ?? handle) + ":" + (address?.toLowerCase() ?? "disconnected"),
    enabled: canUseBuilderApi && !!address,
    cmsPackage: validation.cmsPackage,
    draftId,
    dirty,
    busy,
    jsonDraft: jsonDraft ?? undefined,
    leaveMessage: t(locale, "profileCms.builder.recovery.leave"),
  });
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
    setDirty(true);
  };

  const updateState = (patch: Partial<CmsBuilderState>) => {
    setState((current) => updateCmsBuilderState(current, patch));
    clearActionResult();
  };

  const selectTemplate = (template: CmsBuilderTemplate) => {
    if (
      template !== state.template &&
      (dirty || state.sourcePackage) &&
      !confirmCmsDiscard(locale)
    )
      return;
    gallerySnapshotRequestIdRef.current += 1;
    setGallerySnapshotStatus("idle");
    setState((current) => {
      if (current.template === template) {
        return current;
      }

      return {
        ...current,
        template,
        sourcePackage: undefined,
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
    if (patch.walletInput !== undefined) {
      gallerySnapshotRequestIdRef.current += 1;
      setGallerySnapshotStatus("idle");
    }
    setState((current) =>
      updateCmsBuilderState(current, {
        template: "wallet_gallery",
        gallery: {
          ...current.gallery,
          ...patch,
        },
      })
    );
    clearActionResult();
  };

  const updateBlock = (index: number, patch: Partial<CmsBuilderBlock>) => {
    setState((current) =>
      updateCmsBuilderState(current, {
        blocks: current.blocks.map((block, blockIndex) =>
          blockIndex === index ? { ...block, ...patch } : block
        ),
      })
    );
    clearActionResult();
  };

  const requestGallerySnapshot = async () => {
    if (!canRequestGallerySnapshot) {
      setGallerySnapshotStatus("error");
      setGallerySnapshotError(
        t(locale, "profileCms.builder.gallery.snapshot.signInRequired")
      );
      return;
    }
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
        sources: parsed.sources,
      });
      if (requestId !== gallerySnapshotRequestIdRef.current) {
        return;
      }

      setState((current) =>
        updateCmsBuilderState(current, {
          template: "wallet_gallery",
          gallery: refreshWalletGalleryState(current.gallery, snapshot),
        })
      );
      clearActionResult();
      setGallerySnapshotStatus("ready");
    } catch (error) {
      if (requestId !== gallerySnapshotRequestIdRef.current) {
        return;
      }
      setGallerySnapshotStatus("error");
      setGallerySnapshotError(
        t(
          locale,
          getStructuredApiErrorStatus(error) === 401
            ? "profileCms.builder.gallery.snapshot.sessionExpired"
            : "profileCms.builder.gallery.snapshot.failed"
        )
      );
    }
  };

  const addBlock = (kind: CmsBuilderBlockKind) => {
    setState((current) =>
      updateCmsBuilderState(current, {
        blocks: [
          ...current.blocks,
          createBuilderBlock(kind, current.blocks.length, {
            id: `block-${kind}-${Date.now()}-${stateVersionRef.current}`,
          }),
        ],
      })
    );
    clearActionResult();
  };

  const removeBlock = (index: number) => {
    setState((current) =>
      updateCmsBuilderState(current, {
        blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index),
      })
    );
    clearActionResult();
  };

  const importJson = () => {
    setImportError("");
    try {
      const importedPackage = parseCmsPackageCandidateJson(
        jsonDraft ?? packageJson
      );
      if (importedPackage.profile.handle.toLowerCase() !== handle.toLowerCase())
        throw new Error("profile_mismatch");
      gallerySnapshotRequestIdRef.current += 1;
      setState(createBuilderStateFromPackage(importedPackage));
      setJsonDraft(null);
      clearActionResult();
      setActiveTab("editor");
    } catch {
      setImportError(t(locale, "profileCms.builder.json.importFailed"));
    }
  };

  const applyAgentPackage = (cmsPackage: CmsPackageV1) => {
    if (cmsPackage.profile.handle.toLowerCase() !== handle.toLowerCase())
      return;
    gallerySnapshotRequestIdRef.current += 1;
    setState(createBuilderStateFromPackage(cmsPackage));
    setJsonDraft(null);
    clearActionResult();
  };

  const runAction = async (action: ProfileCmsBuilderAction) => {
    if (busy || hasUnappliedJson || !galleryReady) return;
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
        profileId: canUseBuilderApi ? profileId : undefined,
        primaryWallet: connectedProfile?.primary_wallet ?? address,
      });
      if (
        actionRequestId !== actionRequestIdRef.current ||
        stateVersion !== stateVersionRef.current
      ) {
        return;
      }
      if (result.ok && result.draftId) {
        setDraftId(result.draftId);
        setDirty(false);
        setHistoryRevision((value) => value + 1);
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

  const loadPackage = async (id: string) => {
    if (!canUseBuilderApi || busy) return;
    if (dirty && !confirmCmsDiscard(locale)) return;
    gallerySnapshotRequestIdRef.current += 1;
    const version = ++stateVersionRef.current;
    setIsSubmitting(true);
    setImportError("");
    try {
      const record = await getProfileCmsPackageById(id);
      if (version !== stateVersionRef.current) return;
      if (record.profileId !== profileId) throw new Error("profile_mismatch");
      setState(createBuilderStateFromPackage(record.cmsPackage));
      setDraftId(record.id);
      setDraftVersion(record.version);
      setJsonDraft(null);
      setActiveTab("editor");
      setDirty(false);
      setActionResult(null);
    } catch {
      setImportError(t(locale, "profileCms.builder.drafts.loadFailed"));
    } finally {
      setIsSubmitting(false);
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
              disabled={
                busy ||
                hasUnappliedJson ||
                !galleryReady ||
                !canUseBuilderApi ||
                !isProfileCmsBuilderApiEnabledEnv()
              }
              label={t(locale, "profileCms.builder.cta.saveDraft")}
              onClick={() => void runAction("save_draft")}
            />
            <BuilderActionButton
              disabled={
                busy ||
                hasUnappliedJson ||
                !galleryReady ||
                !canUseBuilderApi ||
                !isProfileCmsBuilderApiEnabledEnv()
              }
              label={t(locale, "profileCms.builder.cta.serverValidate")}
              onClick={() => void runAction("validate")}
            />
          </div>
        </div>
      </header>

      <div
        className="tw-mx-auto tw-max-w-7xl tw-px-4 tw-pt-4"
        aria-live="polite"
      >
        <p>{t(locale, getDraftStateMessage(dirty, draftId))}</p>
        {!galleryReady ? (
          <p>{t(locale, "profileCms.builder.gallery.snapshot.required")}</p>
        ) : null}
        {importError ? <p role="alert">{importError}</p> : null}
        {recovery.failed ? (
          <div>
            <p role="alert">
              {t(locale, "profileCms.builder.recovery.failed")}
            </p>
            <BuilderActionButton
              label={t(locale, "profileCms.builder.recovery.discard")}
              disabled={busy}
              onClick={recovery.dismissRecovery}
            />
          </div>
        ) : null}
        {recovery.recovery ? (
          <div>
            <p>{t(locale, "profileCms.builder.recovery.title")}</p>
            <BuilderActionButton
              label={t(locale, "profileCms.builder.recovery.restore")}
              disabled={busy}
              onClick={() => {
                if (!recovery.recovery) return;
                if (dirty && !confirmCmsDiscard(locale)) return;
                gallerySnapshotRequestIdRef.current += 1;
                setState(
                  createBuilderStateFromPackage(recovery.recovery.cmsPackage)
                );
                setDraftId(recovery.recovery.draftId);
                setJsonDraft(recovery.recovery.jsonDraft ?? null);
                setActiveTab(
                  recovery.recovery.jsonDraft === undefined ? "editor" : "json"
                );
                clearActionResult();
                recovery.dismissRecovery();
              }}
            />
            <BuilderActionButton
              label={t(locale, "profileCms.builder.recovery.discard")}
              disabled={busy}
              onClick={recovery.dismissRecovery}
            />
          </div>
        ) : null}
      </div>
      <div className="tw-mx-auto tw-max-w-7xl tw-px-4">
        <ProfileCmsPendingJsonPanel
          pending={hasUnappliedJson}
          busy={busy}
          locale={locale}
          onReview={() => setActiveTab("json")}
          onDiscard={() => {
            if (confirmCmsDiscard(locale)) setJsonDraft(null);
          }}
        />
      </div>
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
                setActiveTab("json");
              }}
            />
            <TabButton
              active={activeTab === "agent"}
              label={t(locale, "profileCms.builder.tab.agent")}
              onClick={() => setActiveTab("agent")}
            />
          </div>

          <fieldset
            disabled={busy || (hasUnappliedJson && activeTab !== "json")}
            className="tw-min-w-0 tw-border-0 tw-p-0"
          >
            {activeTab === "editor" && canVisuallyEditCmsPackage(state) ? (
              <EditorPanel
                addBlock={addBlock}
                canRequestGallerySnapshot={canRequestGallerySnapshot}
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

            {activeTab === "editor" && !canVisuallyEditCmsPackage(state) ? (
              <p className="tw-p-4">
                {t(locale, "profileCms.builder.editor.advanced")}
              </p>
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
                jsonDraft={jsonDraft ?? packageJson}
                locale={locale}
                onChange={(value) => {
                  setJsonDraft(value);
                  setDirty(true);
                }}
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
          </fieldset>
        </section>

        <aside className="tw-flex tw-flex-col tw-gap-5">
          <ProfileCmsPublishPanel
            key={validation.cmsPackage.integrity.package_hash}
            cmsPackage={validation.cmsPackage}
            profileId={profileId}
            primaryWallet={connectedProfile?.primary_wallet ?? address}
            canUseBuilderApi={
              canUseBuilderApi && isProfileCmsBuilderApiEnabledEnv()
            }
            canPublish={
              validation.result.valid &&
              !busy &&
              !hasUnappliedJson &&
              galleryReady
            }
            locale={locale}
            onBusyChange={setIsPublishing}
            onPublished={(published) => {
              setDraftId(published.id);
              setDraftVersion(published.version);
              setDirty(false);
              setHistoryRevision((value) => value + 1);
            }}
          />
          {profileId ? (
            <ProfileCmsVersionHistoryPanel
              profileId={profileId}
              enabled={canUseBuilderApi && isProfileCmsBuilderApiEnabledEnv()}
              refreshToken={historyRevision}
              locale={locale}
              busy={busy}
              onLoad={(id) => void loadPackage(id)}
              onChanged={() => setHistoryRevision((value) => value + 1)}
            />
          ) : null}
          <ValidationPanel
            issues={actionResult?.serverIssues ?? validation.result.issues}
            locale={locale}
            valid={
              validation.result.valid &&
              actionResult?.code !== "server_validation_invalid"
            }
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

function isCmsBuilderOwner(
  profileId: string | undefined,
  connectedProfileId: string | null | undefined,
  isProxy: boolean
): boolean {
  return !!profileId && connectedProfileId === profileId && !isProxy;
}

function confirmCmsDiscard(locale: SupportedLocale): boolean {
  // Confirm synchronously before replacing the editor's only unsaved working copy.
  // eslint-disable-next-line no-alert
  return globalThis.confirm(t(locale, "profileCms.builder.recovery.replace"));
}

function getDraftStateMessage(
  dirty: boolean,
  draftId: string | undefined
): Parameters<typeof t>[1] {
  if (dirty) return "profileCms.builder.recovery.unsaved";
  return draftId
    ? "profileCms.builder.recovery.saved"
    : "profileCms.builder.publishState.noDraft";
}

function hasPendingCmsJson(
  jsonDraft: string | null,
  packageJson: string
): boolean {
  return jsonDraft !== null && jsonDraft !== packageJson;
}

function isCmsBuilderBusy(
  submitting: boolean,
  publishing: boolean,
  snapshot: GallerySnapshotStatus
): boolean {
  return submitting || publishing || snapshot === "loading";
}

function isCmsGalleryReady(state: CmsBuilderState): boolean {
  return (
    state.template !== "wallet_gallery" ||
    state.gallery.snapshot?.source === "backend"
  );
}
