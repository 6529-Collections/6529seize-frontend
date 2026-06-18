import { useMemo, useState, type ChangeEvent } from "react";

import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  createCmsBuilderSchemaBundle,
  createCmsBuilderSourcePacket,
  reviewCmsAgentPatch,
  type CmsAgentPatchChange,
  type CmsAgentPatchReview,
  type CmsAgentPatchReviewError,
  type CmsBuilderSchemaBundle,
  type CmsBuilderSourcePacket,
} from "@/lib/profile-cms/builder/agent";
import type { CmsBuilderValidation } from "@/lib/profile-cms/builder/package";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

const MAX_AGENT_PATCH_FILE_BYTES = 2 * 1024 * 1024;

export function ProfileCmsAgentPanel({
  canUseBuilderApi,
  currentDraftVersion,
  draftId,
  locale = DEFAULT_LOCALE,
  onApplyPackage,
  profileId,
  validation,
}: {
  readonly canUseBuilderApi: boolean;
  readonly currentDraftVersion: number;
  readonly draftId?: string | undefined;
  readonly locale?: SupportedLocale | undefined;
  readonly onApplyPackage: (cmsPackage: CmsPackageV1) => void;
  readonly profileId?: string | undefined;
  readonly validation: CmsBuilderValidation;
}) {
  const sourcePacket = createCmsBuilderSourcePacket({
    canUseBuilderApi,
    cmsPackage: validation.cmsPackage,
    draftId,
    draftVersion: currentDraftVersion,
    profileId,
    validation: validation.result,
  });
  const schemaBundle = useMemo(() => createCmsBuilderSchemaBundle(), []);
  const [patchDraft, setPatchDraft] = useState("");
  const [patchReview, setPatchReview] = useState<CmsAgentPatchReview | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");

  const reviewPatch = () => {
    setStatusMessage("");
    setUploadErrorMessage("");
    setPatchReview(
      reviewCmsAgentPatch({
        currentDraftId: draftId,
        currentDraftVersion,
        currentPackage: validation.cmsPackage,
        patchJson: patchDraft,
      })
    );
  };

  const applyPatch = () => {
    if (!patchReview?.ok) {
      return;
    }

    onApplyPackage(patchReview.proposedPackage);
    setPatchDraft("");
    setPatchReview(null);
    setStatusMessage(t(locale, "profileCms.builder.agent.patch.applied"));
  };

  const uploadPatch = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    setStatusMessage("");
    setUploadErrorMessage("");
    setPatchReview(null);
    if (file.size > MAX_AGENT_PATCH_FILE_BYTES) {
      setPatchDraft("");
      setUploadErrorMessage(
        t(locale, "profileCms.builder.agent.patch.fileTooLarge")
      );
      event.currentTarget.value = "";
      return;
    }

    setPatchDraft(await file.text());
    event.currentTarget.value = "";
  };

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-5 tw-p-4 xl:tw-grid-cols-[minmax(0,1fr)_360px]">
      <section className="tw-flex tw-min-w-0 tw-flex-col tw-gap-4">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
          <div>
            <h2 className="tw-text-lg tw-font-semibold tw-text-white">
              {t(locale, "profileCms.builder.agent.source.title")}
            </h2>
            <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "profileCms.builder.agent.source.description")}
            </p>
          </div>
          <DownloadActions
            locale={locale}
            schemaBundle={schemaBundle}
            sourcePacket={sourcePacket}
            validation={validation}
          />
        </div>
        <SourcePacketViewer locale={locale} sourcePacket={sourcePacket} />
      </section>

      <section className="tw-flex tw-min-w-0 tw-flex-col tw-gap-4">
        <div>
          <h2 className="tw-text-lg tw-font-semibold tw-text-white">
            {t(locale, "profileCms.builder.agent.patch.title")}
          </h2>
          <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "profileCms.builder.agent.patch.description")}
          </p>
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <label className="tw-flex tw-min-h-10 tw-cursor-pointer tw-items-center tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400">
            {t(locale, "profileCms.builder.agent.patch.upload")}
            <input
              accept="application/json,.json"
              className="tw-sr-only"
              onChange={(event) => void uploadPatch(event)}
              type="file"
            />
          </label>
          <button
            className="tw-min-h-10 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-px-3 tw-text-sm tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            disabled={!patchDraft.trim()}
            onClick={reviewPatch}
            type="button"
          >
            {t(locale, "profileCms.builder.agent.patch.review")}
          </button>
          <button
            className="tw-min-h-10 tw-border tw-border-solid tw-border-green tw-bg-green/10 tw-px-3 tw-text-sm tw-font-semibold tw-text-green disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            disabled={!patchReview?.ok}
            onClick={applyPatch}
            type="button"
          >
            {t(locale, "profileCms.builder.agent.patch.apply")}
          </button>
        </div>
        {statusMessage ? (
          <p className="tw-border tw-border-solid tw-border-green tw-bg-green/10 tw-p-3 tw-text-sm tw-text-green">
            {statusMessage}
          </p>
        ) : null}
        {uploadErrorMessage ? (
          <p className="tw-border tw-border-solid tw-border-red tw-bg-red/10 tw-p-3 tw-text-sm tw-text-red">
            {uploadErrorMessage}
          </p>
        ) : null}
        <label
          className="tw-text-sm tw-font-medium tw-text-iron-300"
          htmlFor="cms-builder-agent-patch"
        >
          {t(locale, "profileCms.builder.agent.patch.label")}
        </label>
        <textarea
          className="tw-min-h-[260px] tw-w-full tw-border tw-border-solid tw-border-iron-700 tw-bg-black tw-p-3 tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
          id="cms-builder-agent-patch"
          onChange={(event) => {
            setPatchDraft(event.target.value);
            setPatchReview(null);
            setStatusMessage("");
            setUploadErrorMessage("");
          }}
          spellCheck={false}
          value={patchDraft}
        />
        <PatchReviewPanel locale={locale} review={patchReview} />
      </section>
    </div>
  );
}

export function downloadJsonFile(filename: string, data: unknown): void {
  if (
    typeof globalThis.document === "undefined" ||
    typeof globalThis.URL?.createObjectURL !== "function"
  ) {
    return;
  }

  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json",
  });
  const url = globalThis.URL.createObjectURL(blob);
  const link = globalThis.document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  globalThis.URL.revokeObjectURL(url);
}

function DownloadActions({
  locale,
  schemaBundle,
  sourcePacket,
  validation,
}: {
  readonly locale: SupportedLocale;
  readonly schemaBundle: CmsBuilderSchemaBundle;
  readonly sourcePacket: CmsBuilderSourcePacket;
  readonly validation: CmsBuilderValidation;
}) {
  const handle = sourcePacket.facts.profile_handle;
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2">
      <DownloadButton
        label={t(locale, "profileCms.builder.json.downloadPackage")}
        onClick={() =>
          downloadJsonFile(`${handle}-cms-package.json`, validation.cmsPackage)
        }
      />
      <DownloadButton
        label={t(locale, "profileCms.builder.json.downloadSourcePacket")}
        onClick={() =>
          downloadJsonFile(`${handle}-cms-source-packet.json`, sourcePacket)
        }
      />
      <DownloadButton
        label={t(locale, "profileCms.builder.json.downloadSchemaBundle")}
        onClick={() =>
          downloadJsonFile(`${handle}-cms-schema-bundle.json`, schemaBundle)
        }
      />
    </div>
  );
}

function SourcePacketViewer({
  locale,
  sourcePacket,
}: {
  readonly locale: SupportedLocale;
  readonly sourcePacket: CmsBuilderSourcePacket;
}) {
  const validationLabel = sourcePacket.validation_diagnostics.valid
    ? t(locale, "profileCms.builder.validation.valid")
    : t(locale, "profileCms.builder.validation.invalid");
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-3 lg:tw-grid-cols-2">
      <PacketSection
        items={[
          [
            t(locale, "profileCms.builder.agent.packet.label.profile"),
            sourcePacket.facts.profile_handle,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.package"),
            sourcePacket.facts.package_id,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.draft"),
            sourcePacket.draft.draft_id,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.route"),
            sourcePacket.facts.site_base_path,
          ],
        ]}
        title={t(locale, "profileCms.builder.agent.packet.facts")}
      />
      <PacketSection
        items={[
          [
            t(locale, "profileCms.builder.agent.packet.label.site"),
            sourcePacket.author_copy.site_title,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.page"),
            sourcePacket.author_copy.page_title,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.navigation"),
            sourcePacket.author_copy.navigation_label,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.blocks"),
            String(sourcePacket.author_copy.blocks.length),
          ],
        ]}
        title={t(locale, "profileCms.builder.agent.packet.authorCopy")}
      />
      <PacketSection
        items={[
          [
            t(locale, "profileCms.builder.agent.packet.label.canonical"),
            sourcePacket.derived_metadata.canonical_url,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.packageHash"),
            sourcePacket.derived_metadata.package_hash,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.payloadHash"),
            sourcePacket.derived_metadata.payload_hash,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.assets"),
            String(sourcePacket.derived_metadata.asset_count),
          ],
        ]}
        title={t(locale, "profileCms.builder.agent.packet.derivedMetadata")}
      />
      <PacketSection
        items={[
          [
            t(locale, "profileCms.builder.agent.packet.label.status"),
            validationLabel,
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.issues"),
            String(sourcePacket.validation_diagnostics.issues.length),
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.baseVersion"),
            String(sourcePacket.draft.base_version),
          ],
          [
            t(locale, "profileCms.builder.agent.packet.label.writable"),
            sourcePacket.draft.writable_by_connected_profile
              ? t(locale, "profileCms.builder.agent.packet.value.yes")
              : t(locale, "profileCms.builder.agent.packet.value.no"),
          ],
        ]}
        title={t(locale, "profileCms.builder.agent.packet.validation")}
      />
      <section className="tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-p-3 lg:tw-col-span-2">
        <h3 className="tw-text-primary-200 tw-text-sm tw-font-semibold tw-uppercase">
          {t(locale, "profileCms.builder.agent.packet.safety")}
        </h3>
        <ul className="tw-mt-2 tw-flex tw-flex-col tw-gap-1 tw-text-sm tw-leading-6 tw-text-iron-100">
          {sourcePacket.prompt_injection_rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PacketSection({
  items,
  title,
}: {
  readonly items: readonly (readonly [string, string])[];
  readonly title: string;
}) {
  return (
    <section className="tw-min-w-0 tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3">
      <h3 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
        {title}
      </h3>
      <dl className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 tw-text-sm">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="tw-break-words tw-text-iron-500">{label}</dt>
            <dd className="tw-break-all tw-text-iron-100">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PatchReviewPanel({
  locale,
  review,
}: {
  readonly locale: SupportedLocale;
  readonly review: CmsAgentPatchReview | null;
}) {
  if (!review) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      <div
        className={`tw-border tw-border-solid tw-p-3 tw-text-sm ${
          review.ok
            ? "tw-border-green tw-bg-green/10 tw-text-green"
            : "tw-border-red tw-bg-red/10 tw-text-red"
        }`}
      >
        {review.ok
          ? t(locale, "profileCms.builder.agent.patch.accepted")
          : t(locale, "profileCms.builder.agent.patch.rejected")}
      </div>
      {review.errors.length ? (
        <ul className="tw-flex tw-flex-col tw-gap-2">
          {review.errors.map((error) => (
            <li
              className="tw-border tw-border-solid tw-border-red tw-bg-black tw-p-3 tw-text-sm tw-text-red"
              key={`${error.code}-${error.path ?? ""}-${error.message}`}
            >
              <p className="tw-break-words tw-font-semibold">
                {t(locale, "profileCms.builder.agent.error.codeLabel", {
                  code: error.code,
                })}
              </p>
              <p className="tw-mt-1 tw-leading-6">
                {getPatchErrorMessage(locale, error)}
              </p>
              {error.path ? (
                <p className="tw-mt-1 tw-break-all tw-font-mono tw-text-xs">
                  {error.path}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {review.changes.length ? (
        <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-3">
          <h3 className="tw-text-sm tw-font-semibold tw-uppercase tw-text-primary-300">
            {t(locale, "profileCms.builder.agent.patch.diff")}
          </h3>
          <ul className="tw-mt-3 tw-flex tw-flex-col tw-gap-3">
            {review.changes.map((change) => (
              <PatchChangeItem
                change={change}
                key={`${change.op}-${change.path}`}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function PatchChangeItem({ change }: { readonly change: CmsAgentPatchChange }) {
  return (
    <li className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-text-sm">
      <p className="tw-font-semibold tw-text-white">{change.op}</p>
      <p className="tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-iron-500">
        {change.path}
      </p>
      <div className="tw-mt-2 tw-grid tw-grid-cols-1 tw-gap-2 md:tw-grid-cols-2">
        <pre className="tw-min-h-12 tw-whitespace-pre-wrap tw-break-words tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-2 tw-text-xs tw-text-iron-400">
          {formatPatchValue(change.before)}
        </pre>
        <pre className="tw-min-h-12 tw-whitespace-pre-wrap tw-break-words tw-border tw-border-solid tw-border-iron-800 tw-bg-black tw-p-2 tw-text-xs tw-text-iron-100">
          {formatPatchValue(change.after)}
        </pre>
      </div>
      {change.reason ? (
        <p className="tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
          {change.reason}
        </p>
      ) : null}
    </li>
  );
}

function DownloadButton({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function formatPatchValue(value: unknown): string {
  if (value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function getPatchErrorMessage(
  locale: SupportedLocale,
  error: CmsAgentPatchReviewError
): string {
  switch (error.code) {
    case "patch.json_invalid":
      return t(locale, "profileCms.builder.agent.error.jsonInvalid");
    case "patch.schema_invalid":
      return t(locale, "profileCms.builder.agent.error.schemaInvalid");
    case "patch.target_draft_mismatch":
      return t(locale, "profileCms.builder.agent.error.targetDraftMismatch");
    case "patch.base_version_mismatch":
      return t(locale, "profileCms.builder.agent.error.baseVersionMismatch");
    case "patch.base_hash_missing":
      return t(locale, "profileCms.builder.agent.error.baseHashMissing");
    case "patch.base_hash_mismatch":
      return t(locale, "profileCms.builder.agent.error.baseHashMismatch");
    case "patch.operation_unsupported":
      return t(locale, "profileCms.builder.agent.error.operationUnsupported", {
        op: getErrorParam(error, "op"),
      });
    case "patch.page_missing":
      return t(locale, "profileCms.builder.agent.error.pageMissing");
    case "patch.value_invalid":
      return t(locale, "profileCms.builder.agent.error.valueInvalid");
    case "patch.path_unsupported":
      return t(locale, "profileCms.builder.agent.error.pathUnsupported", {
        path: getErrorParam(error, "path") || error.path || "",
      });
    case "patch.metadata_field_unsupported":
      return t(
        locale,
        "profileCms.builder.agent.error.metadataFieldUnsupported",
        {
          field: getErrorParam(error, "field"),
        }
      );
    case "patch.block_field_unsupported":
      return t(locale, "profileCms.builder.agent.error.blockFieldUnsupported", {
        field: getErrorParam(error, "field"),
      });
    case "patch.block_duplicate_id":
      return t(locale, "profileCms.builder.agent.error.blockDuplicateId", {
        id: getErrorParam(error, "id"),
      });
    case "patch.block_structural_mix":
      return t(locale, "profileCms.builder.agent.error.blockStructuralMix");
    case "patch.navigation_missing":
      return t(locale, "profileCms.builder.agent.error.navigationMissing");
    default:
      return t(locale, "profileCms.builder.agent.error.validationRejected", {
        code: error.code,
      });
  }
}

function getErrorParam(error: CmsAgentPatchReviewError, key: string): string {
  const value = error.params?.[key];
  return value === undefined ? "" : String(value);
}
