"use client";

import { useMemo, useRef, useState, type ComponentProps } from "react";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  ProfileCmsAgentPanel,
  downloadJsonFile,
} from "@/components/profile-cms-builder/ProfileCmsAgentPanel";
import {
  BuilderActionButton,
  TabButton,
} from "@/components/profile-cms-builder/ProfileCmsBuilderControls";
import ProfileCmsStudioEditor, {
  type StudioEditorHandle,
} from "./studio/ProfileCmsStudioEditor";
import { JsonPanel } from "@/components/profile-cms-builder/ProfileCmsBuilderJsonPanel";
import {
  PublishStatePanel,
  ValidationPanel,
  getExpectedBuilderEndpoint,
  getActionResultMessage,
} from "@/components/profile-cms-builder/ProfileCmsBuilderStatusPanels";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  createCmsBuilderSchemaBundle,
  createCmsBuilderSourcePacket,
} from "@/lib/profile-cms/builder/agent";
import {
  runProfileCmsBuilderAction,
  type ProfileCmsBuilderAction,
  type ProfileCmsBuilderActionResult,
} from "@/lib/profile-cms/builder/api";
import {
  createBuilderStateFromPackage,
  createDefaultCmsBuilderState,
  parseCmsPackageCandidateJson,
  validateCmsBuilderState,
  type CmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

import ProfileCmsPublishPanel from "./ProfileCmsPublishPanel";
import ProfileCmsPendingJsonPanel from "./ProfileCmsPendingJsonPanel";
import ProfileCmsVersionHistoryPanel from "./ProfileCmsVersionHistoryPanel";
import { useCmsDraftRecovery } from "./useCmsDraftRecovery";
import { isProfileCmsBuilderApiEnabledEnv } from "@/config/profileCmsBuilderEnv";
import { getProfileCmsPackageById } from "@/lib/profile-cms/builder/api";

export default function ProfileCmsBuilder(
  props: ComponentProps<typeof ProfileCmsBuilderWorkspace>
) {
  const { connectedProfile, activeProfileProxy, isAuthenticated } = useAuth();
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
        (activeProfileProxy ? "proxy" : "owner") +
        ":" +
        (isAuthenticated === true ? "authenticated" : "guest")
      }
      {...props}
    />
  );
}

type BuilderTab = "editor" | "json" | "agent" | "publish" | "history";
function ProfileCmsBuilderWorkspace({
  handle,
  locale = DEFAULT_LOCALE,
  profileId,
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
  const [studioRevision, setStudioRevision] = useState(0);
  const [studioPending, setStudioPending] = useState(false);
  const studioPendingRef = useRef(false);
  const [studioUploading, setStudioUploading] = useState(false);
  const studioUploadingRef = useRef(false);
  const changeStudioUploading = (uploading: boolean) => {
    studioUploadingRef.current = uploading;
    setStudioUploading(uploading);
  };
  const studioHandle = useRef<StudioEditorHandle>(null);
  const changeStudioPending = (pending: boolean) => {
    studioPendingRef.current = pending;
    setStudioPending(pending);
  };
  const guardStudioForm = () => {
    if (!studioPendingRef.current && !studioUploadingRef.current) return true;
    studioHandle.current?.focusPendingForm();
    return false;
  };
  const changeTab = (tab: BuilderTab) => {
    if (guardStudioForm()) setActiveTab(tab);
  };
  const [samplesReviewed, setSamplesReviewed] = useState(false);
  const actionRequestIdRef = useRef(0);
  const stateVersionRef = useRef(0);
  const { activeProfileProxy, connectedProfile, isAuthenticated } = useAuth();
  const { address } = useSeizeConnectContext();

  const validation = useMemo(() => validateCmsBuilderState(state), [state]);
  const packageJson = useMemo(
    () => JSON.stringify(validation.cmsPackage, null, 2),
    [validation.cmsPackage]
  );
  const canUseBuilderApi =
    isCmsBuilderOwner(profileId, connectedProfile?.id, !!activeProfileProxy) &&
    isAuthenticated === true;
  const canRequestGallerySnapshot =
    !isProfileCmsBuilderApiEnabledEnv() || isAuthenticated === true;
  const busy = isSubmitting || isPublishing;
  const sampleReviewRequired =
    validation.cmsPackage.payload.source_packets?.some(
      (packet) =>
        (packet as Record<string, unknown>)["content_status"] ===
        "fictional_example"
    ) && !samplesReviewed;
  const hasUnappliedJson = hasPendingCmsJson(jsonDraft, packageJson);
  const galleryReady = isCmsGalleryReady(state);
  const recovery = useCmsDraftRecovery({
    scope:
      (profileId ?? handle) + ":" + (address?.toLowerCase() ?? "disconnected"),
    enabled: canUseBuilderApi && !!address,
    cmsPackage: validation.cmsPackage,
    draftId,
    dirty,
    busy: busy || studioPending || studioUploading,
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

  const importJson = () => {
    setImportError("");
    try {
      const importedPackage = parseCmsPackageCandidateJson(
        jsonDraft ?? packageJson
      );
      if (importedPackage.profile.handle.toLowerCase() !== handle.toLowerCase())
        throw new Error("profile_mismatch");
      setState(createBuilderStateFromPackage(importedPackage));
      setStudioRevision((value) => value + 1);
      setSamplesReviewed(false);
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
    setState(createBuilderStateFromPackage(cmsPackage));
    setSamplesReviewed(false);
    setJsonDraft(null);
    clearActionResult();
  };

  const runAction = async (action: ProfileCmsBuilderAction) => {
    if (!guardStudioForm() || busy || hasUnappliedJson || !galleryReady) return;
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
    if (!guardStudioForm() || !canUseBuilderApi || busy) return;
    if (dirty && !confirmCmsDiscard(locale)) return;
    const version = ++stateVersionRef.current;
    setIsSubmitting(true);
    setImportError("");
    try {
      const record = await getProfileCmsPackageById(id);
      if (version !== stateVersionRef.current) return;
      if (record.profileId !== profileId) throw new Error("profile_mismatch");
      setState(createBuilderStateFromPackage(record.cmsPackage));
      setStudioRevision((value) => value + 1);
      setSamplesReviewed(false);
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
        <div className="tw-mx-auto tw-flex tw-max-w-[1800px] tw-flex-col tw-gap-2 tw-px-3 tw-py-3 sm:tw-gap-4 sm:tw-px-6 sm:tw-py-5 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between lg:tw-px-8">
          <div>
            <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
              {state.handle}
            </p>
            <h1 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white sm:tw-text-2xl">
              {t(locale, "profileCms.studio.title")}
            </h1>
          </div>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <BuilderActionButton
              disabled={
                busy ||
                studioPending ||
                studioUploading ||
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
                studioPending ||
                studioUploading ||
                hasUnappliedJson ||
                !galleryReady ||
                !canUseBuilderApi ||
                !isProfileCmsBuilderApiEnabledEnv()
              }
              label={t(locale, "profileCms.studio.publish")}
              onClick={() => changeTab("publish")}
            />
          </div>
        </div>
      </header>

      <div
        className="tw-mx-auto tw-max-w-[1800px] tw-px-3 tw-pt-2 sm:tw-px-4 sm:tw-pt-4"
        aria-live="polite"
      >
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, getDraftStateMessage(dirty, draftId))}
        </p>
        {!canUseBuilderApi ? (
          <p className="tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(locale, "profileCms.studio.ownerRequired")}
          </p>
        ) : null}
        {studioPending ? (
          <p role="status" className="tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(locale, "profileCms.studio.pendingForm")}
          </p>
        ) : null}
        {studioUploading ? (
          <p role="status" className="tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(locale, "profileCms.studio.pendingUpload")}
          </p>
        ) : null}
        {actionResult ? (
          <p
            role={actionResult.ok ? "status" : "alert"}
            className="tw-text-sm tw-leading-6 tw-text-iron-100"
          >
            {getActionResultMessage(locale, actionResult.code)}
          </p>
        ) : null}
        {sampleReviewRequired ? (
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "profileCms.studio.sampleNotice")}
          </p>
        ) : null}
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
                if (!guardStudioForm() || !recovery.recovery) return;
                if (dirty && !confirmCmsDiscard(locale)) return;
                setState(
                  createBuilderStateFromPackage(recovery.recovery.cmsPackage)
                );
                setStudioRevision((value) => value + 1);
                setSamplesReviewed(false);
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
      <div className="tw-mx-auto tw-max-w-[1800px] tw-px-4">
        <ProfileCmsPendingJsonPanel
          pending={hasUnappliedJson}
          busy={busy}
          locale={locale}
          onReview={() => changeTab("json")}
          onDiscard={() => {
            if (confirmCmsDiscard(locale)) setJsonDraft(null);
          }}
        />
      </div>
      <div className="tw-mx-auto tw-grid tw-max-w-[1800px] tw-grid-cols-1 tw-gap-3 tw-px-3 tw-py-3 sm:tw-gap-5 sm:tw-px-6 sm:tw-py-5 lg:tw-px-8">
        <section
          aria-label={t(locale, "profileCms.builder.workspaceLabel")}
          className="tw-min-w-0 tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900"
        >
          <div className="tw-flex tw-flex-wrap tw-gap-1 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-black tw-p-2">
            <TabButton
              active={activeTab === "editor"}
              label={t(locale, "profileCms.builder.tab.editor")}
              onClick={() => changeTab("editor")}
            />
            <TabButton
              active={activeTab === "publish"}
              label={t(locale, "profileCms.studio.publish")}
              onClick={() => changeTab("publish")}
            />
            <TabButton
              active={activeTab === "history"}
              label={t(locale, "profileCms.studio.versions")}
              onClick={() => changeTab("history")}
            />
            <details className="tw-ml-auto tw-rounded-lg tw-p-2 tw-text-sm tw-text-iron-300">
              <summary className="tw-cursor-pointer">
                {t(locale, "profileCms.studio.advanced")}
              </summary>
              <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
                <TabButton
                  active={activeTab === "json"}
                  label={t(locale, "profileCms.builder.tab.json")}
                  onClick={() => {
                    changeTab("json");
                  }}
                />
                <TabButton
                  active={activeTab === "agent"}
                  label={t(locale, "profileCms.builder.tab.agent")}
                  onClick={() => changeTab("agent")}
                />
              </div>
            </details>
          </div>

          <fieldset
            disabled={busy || (hasUnappliedJson && activeTab !== "json")}
            className="tw-min-w-0 tw-border-0 tw-p-0"
          >
            <div hidden={activeTab !== "editor"}>
              <ProfileCmsStudioEditor
                key={studioRevision}
                document={validation.cmsPackage}
                locale={locale}
                initialShowTemplates={!state.sourcePackage}
                canRequestSnapshot={canRequestGallerySnapshot}
                canUpload={
                  canUseBuilderApi && isProfileCmsBuilderApiEnabledEnv()
                }
                scopeKey={`${profileId ?? handle}:${address?.toLowerCase() ?? "guest"}:${studioRevision}`}
                onChange={applyAgentPackage}
                onTemplateCreated={() => setSamplesReviewed(false)}
                onPendingChange={changeStudioPending}
                onUploadBusyChange={changeStudioUploading}
                handleRef={studioHandle}
              />
            </div>

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

        <aside
          className={`tw-mx-auto tw-w-full tw-max-w-4xl tw-flex-col tw-gap-5 ${activeTab === "publish" || activeTab === "history" ? "tw-flex" : "tw-hidden"}`}
        >
          {activeTab === "publish" && sampleReviewRequired ? (
            <label className="tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-5 tw-text-sm tw-leading-6">
              <input
                type="checkbox"
                checked={samplesReviewed}
                onChange={(event) => setSamplesReviewed(event.target.checked)}
                className="tw-mt-1 tw-h-4 tw-w-4 tw-accent-primary-500"
              />
              <span>{t(locale, "profileCms.studio.reviewSamples")}</span>
            </label>
          ) : null}
          {activeTab === "publish" ? (
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
                !studioPending &&
                !studioUploading &&
                !hasUnappliedJson &&
                galleryReady &&
                !sampleReviewRequired
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
          ) : null}
          {profileId && activeTab === "history" ? (
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
          <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4">
            <summary className="tw-cursor-pointer tw-text-sm tw-text-iron-300">
              {t(locale, "profileCms.studio.details")}
            </summary>
            <PublishStatePanel
              actionResult={actionResult}
              draftId={draftId}
              locale={locale}
              packageHash={validation.cmsPackage.integrity.package_hash}
              payloadHash={validation.cmsPackage.integrity.payload_hash}
            />
          </details>
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

function isCmsGalleryReady(state: CmsBuilderState): boolean {
  return (
    state.template !== "wallet_gallery" ||
    state.gallery.snapshot?.source === "backend"
  );
}
