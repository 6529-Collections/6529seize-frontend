"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth/Auth";
import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT,
  runProfileCmsBuilderAction,
  type ProfileCmsBuilderAction,
  type ProfileCmsBuilderActionCode,
  type ProfileCmsBuilderActionResult,
} from "@/lib/profile-cms/builder/api";
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
} from "@/lib/profile-cms/builder/package";
import type { CmsValidationIssueV1 } from "@/lib/profile-cms/protocol/v1";

type BuilderTab = "editor" | "preview" | "json";

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
  const actionRequestIdRef = useRef(0);
  const stateVersionRef = useRef(0);
  const { activeProfileProxy, connectedProfile } = useAuth();

  const validation = useMemo(() => validateCmsBuilderState(state), [state]);
  const packageJson = useMemo(
    () => JSON.stringify(validation.cmsPackage, null, 2),
    [validation.cmsPackage]
  );
  const canSaveDraft =
    !!profileId && connectedProfile?.id === profileId && !activeProfileProxy;

  const clearActionResult = () => {
    stateVersionRef.current += 1;
    setActionResult(null);
  };

  const updateState = (patch: Partial<CmsBuilderState>) => {
    setState((current) => ({ ...current, ...patch }));
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
    if (action === "save_draft" && !canSaveDraft) {
      setActionResult({
        ok: false,
        action,
        expectedEndpoint: PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT,
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
        profileId: canSaveDraft ? profileId : undefined,
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
              locale={locale}
              removeBlock={removeBlock}
              state={state}
              updateBlock={updateBlock}
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
  locale,
  removeBlock,
  state,
  updateBlock,
  updateState,
}: {
  readonly addBlock: (kind: CmsBuilderBlockKind) => void;
  readonly locale: SupportedLocale;
  readonly removeBlock: (index: number) => void;
  readonly state: CmsBuilderState;
  readonly updateBlock: (
    index: number,
    patch: Partial<CmsBuilderBlock>
  ) => void;
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
            className="tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-p-3 tw-text-left tw-text-sm tw-font-semibold tw-text-white"
            type="button"
          >
            {t(locale, "profileCms.builder.templates.homepage")}
          </button>
          <button
            aria-disabled="true"
            className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3 tw-text-left tw-text-sm tw-text-iron-500"
            disabled
            type="button"
          >
            {t(locale, "profileCms.builder.templates.walletGallery")}{" "}
            {t(locale, "profileCms.builder.templates.status.comingSoon")}
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
    </div>
  );
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
          {!actionResult.ok ? (
            <p className="tw-mt-2 tw-font-mono tw-text-xs">
              {actionResult.expectedEndpoint}
            </p>
          ) : null}
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
