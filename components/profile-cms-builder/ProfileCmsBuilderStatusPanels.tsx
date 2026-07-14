"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  PROFILE_CMS_BUILDER_PACKAGES_ENDPOINT,
  PROFILE_CMS_BUILDER_PUBLISH_ENDPOINT,
  PROFILE_CMS_BUILDER_VALIDATE_ENDPOINT,
  type ProfileCmsBuilderAction,
  type ProfileCmsBuilderActionCode,
  type ProfileCmsBuilderActionResult,
} from "@/lib/profile-cms/builder/api";
import { getBuilderFieldIdForIssuePath } from "@/lib/profile-cms/builder/package";
import type { CmsValidationIssueV1 } from "@/lib/profile-cms/protocol/v1";

import { focusField } from "@/components/profile-cms-builder/ProfileCmsBuilderControls";

export function ValidationPanel({
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

export function PublishStatePanel({
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

export function getExpectedBuilderEndpoint(
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

function getValidationSeverityKey(
  severity: CmsValidationIssueV1["severity"]
): Parameters<typeof t>[1] {
  return severity === "warning"
    ? "profileCms.builder.validation.severity.warning"
    : "profileCms.builder.validation.severity.error";
}
