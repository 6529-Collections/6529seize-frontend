"use client";

import { useState } from "react";

import { t } from "@/i18n/messages";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { useProfileCmsPublishSign } from "@/hooks/profile-cms/useProfileCmsPublishSign";
import {
  prepareProfileCmsPublish,
  signAndPublishProfileCms,
  type ProfileCmsPublishContext,
  type ProfileCmsPublishResult,
  type ProfileCmsPublishStep,
} from "@/lib/profile-cms/builder/publish";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";

type StepStatus = "idle" | "active" | "done" | "error";

const PUBLISH_STEPS: readonly ProfileCmsPublishStep[] = [
  "validate",
  "upload",
  "sign",
  "publish",
];

type ProfileCmsPublishPanelProps = {
  readonly cmsPackage: CmsPackageV1;
  readonly profileId: string | undefined;
  readonly canUseBuilderApi: boolean;
  readonly canPublish: boolean;
  readonly locale?: SupportedLocale | undefined;
  readonly onPublished?: (() => void) | undefined;
};

type PublishState = {
  readonly running: boolean;
  readonly result: ProfileCmsPublishResult | null;
  readonly context: ProfileCmsPublishContext | null;
  // Highest step index that has succeeded (validate=0 ... publish=3).
  readonly reachedStep: number;
};

const INITIAL_STATE: PublishState = {
  running: false,
  result: null,
  context: null,
  reachedStep: -1,
};

export default function ProfileCmsPublishPanel({
  cmsPackage,
  profileId,
  canUseBuilderApi,
  canPublish,
  locale = DEFAULT_LOCALE,
  onPublished,
}: ProfileCmsPublishPanelProps) {
  const { signTypedData, chainId, signerAddress, isConnected, isSafe } =
    useProfileCmsPublishSign();
  const [state, setState] = useState<PublishState>(INITIAL_STATE);

  const disabled =
    state.running ||
    !canUseBuilderApi ||
    !canPublish ||
    !profileId ||
    !isConnected ||
    !signerAddress;

  const runFullPublish = async () => {
    if (!profileId || !signerAddress) {
      return;
    }
    setState({ ...INITIAL_STATE, running: true });

    const prepared = await prepareProfileCmsPublish({
      cmsPackage,
      profileId,
      chainId,
      signerAddress,
      signTypedData,
      isSafe,
    });
    if (!prepared.ok) {
      setState({
        running: false,
        result: prepared,
        context: prepared.context ?? null,
        reachedStep: getReachedStepFromFailure(prepared.step, false),
      });
      return;
    }

    const result = await signAndPublishProfileCms({
      context: prepared.context,
      chainId,
      signerAddress,
      signTypedData,
      isSafe,
    });
    finishAttempt(result, prepared.context);
  };

  // Retry the sign + publish tail with a fresh deadline, reusing the receipt.
  const retrySignAndPublish = async () => {
    if (!state.context || !signerAddress) {
      return;
    }
    setState((current) => ({ ...current, running: true, result: null }));
    const result = await signAndPublishProfileCms({
      context: state.context,
      chainId,
      signerAddress,
      signTypedData,
      isSafe,
    });
    finishAttempt(result, state.context);
  };

  const finishAttempt = (
    result: ProfileCmsPublishResult,
    context: ProfileCmsPublishContext
  ) => {
    if (result.ok) {
      setState({
        running: false,
        result,
        context,
        reachedStep: PUBLISH_STEPS.length,
      });
      onPublished?.();
      return;
    }
    setState({
      running: false,
      result,
      context: result.context ?? context,
      reachedStep: getReachedStepFromFailure(result.step, true),
    });
  };

  const stepStatuses = getStepStatuses(state);

  return (
    <section className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      <h2 className="tw-text-base tw-font-semibold tw-text-white">
        {t(locale, "profileCms.builder.publish.title")}
      </h2>
      <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "profileCms.builder.publish.description")}
      </p>

      <ol className="tw-mt-4 tw-flex tw-flex-col tw-gap-2">
        {PUBLISH_STEPS.map((step, index) => (
          <PublishStepRow
            key={step}
            index={index}
            label={t(locale, getStepLabelKey(step))}
            status={stepStatuses[index] ?? "idle"}
          />
        ))}
      </ol>

      {isSafe ? (
        <p className="tw-text-primary-200 tw-mt-3 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500/10 tw-p-3 tw-text-xs tw-leading-5">
          {t(locale, "profileCms.builder.publish.safeNotice")}
        </p>
      ) : null}

      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
        <button
          className="tw-min-h-10 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-500 tw-px-3 tw-text-sm tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          disabled={disabled}
          onClick={() => void runFullPublish()}
          type="button"
        >
          {state.running
            ? t(locale, "profileCms.builder.publish.publishing")
            : t(locale, "profileCms.builder.publish.publish")}
        </button>
        {canRetrySignTail(state) ? (
          <button
            className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            disabled={state.running}
            onClick={() => void retrySignAndPublish()}
            type="button"
          >
            {isDeadlineExpired(state)
              ? t(locale, "profileCms.builder.publish.reSign")
              : t(locale, "profileCms.builder.publish.retry")}
          </button>
        ) : null}
      </div>

      {!isConnected ? (
        <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "profileCms.builder.publish.walletRequired")}
        </p>
      ) : null}

      <PublishResultBanner locale={locale} result={state.result} />
    </section>
  );
}

function PublishResultBanner({
  locale,
  result,
}: {
  readonly locale: SupportedLocale;
  readonly result: ProfileCmsPublishResult | null;
}) {
  if (!result) {
    return null;
  }

  if (result.ok) {
    return (
      <div
        className="tw-mt-4 tw-border tw-border-solid tw-border-green tw-bg-green/10 tw-p-3 tw-text-sm tw-text-green"
        role="status"
      >
        <p className="tw-font-semibold">
          {t(locale, "profileCms.builder.publish.success")}
        </p>
        <a
          className="tw-mt-2 tw-inline-block tw-break-all tw-font-mono tw-text-xs tw-text-green tw-underline"
          href={result.publishedUrl}
          rel="noreferrer"
          target="_blank"
        >
          {result.publishedUrl}
        </a>
      </div>
    );
  }

  return (
    <div
      className="tw-mt-4 tw-border tw-border-solid tw-border-red tw-bg-red/10 tw-p-3 tw-text-sm tw-text-red"
      role="alert"
    >
      <p className="tw-font-semibold">
        {t(locale, getPublishErrorKey(result.code))}
      </p>
      <p className="tw-mt-1 tw-break-words tw-text-xs tw-leading-5">
        {result.message}
      </p>
    </div>
  );
}

function PublishStepRow({
  index,
  label,
  status,
}: {
  readonly index: number;
  readonly label: string;
  readonly status: StepStatus;
}) {
  return (
    <li className="tw-flex tw-items-center tw-gap-3">
      <span
        aria-hidden="true"
        className={`tw-flex tw-h-6 tw-w-6 tw-flex-none tw-items-center tw-justify-center tw-border tw-border-solid tw-text-xs tw-font-semibold ${getStepBadgeClass(
          status
        )}`}
      >
        {getStepGlyph(status, index)}
      </span>
      <span className={`tw-text-sm ${getStepLabelClass(status)}`}>{label}</span>
    </li>
  );
}

function getStepStatuses(state: PublishState): readonly StepStatus[] {
  const errorIndex =
    state.result && !state.result.ok
      ? PUBLISH_STEPS.indexOf(state.result.step)
      : -1;

  return PUBLISH_STEPS.map((_, index) => {
    if (index === errorIndex) {
      return "error";
    }
    if (index <= state.reachedStep) {
      return "done";
    }
    if (state.running && index === state.reachedStep + 1) {
      return "active";
    }
    return "idle";
  });
}

function getReachedStepFromFailure(
  step: ProfileCmsPublishStep,
  hasContext: boolean
): number {
  // On failure, all steps strictly before the failed one succeeded. When the
  // sign/publish tail fails after a successful upload, mark upload as done.
  const failedIndex = PUBLISH_STEPS.indexOf(step);
  if (hasContext) {
    return Math.max(failedIndex - 1, PUBLISH_STEPS.indexOf("upload"));
  }
  return failedIndex - 1;
}

function canRetrySignTail(state: PublishState): boolean {
  return (
    !state.running &&
    state.context !== null &&
    state.result !== null &&
    !state.result.ok
  );
}

function isDeadlineExpired(state: PublishState): boolean {
  return (
    state.result !== null &&
    !state.result.ok &&
    state.result.code === "deadline_expired"
  );
}

function getStepBadgeClass(status: StepStatus): string {
  switch (status) {
    case "done":
      return "tw-border-green tw-bg-green/10 tw-text-green";
    case "active":
      return "tw-border-primary-400 tw-bg-primary-500/10 tw-text-primary-200";
    case "error":
      return "tw-border-red tw-bg-red/10 tw-text-red";
    case "idle":
      return "tw-border-iron-700 tw-bg-black tw-text-iron-500";
  }
}

function getStepLabelClass(status: StepStatus): string {
  switch (status) {
    case "done":
      return "tw-text-iron-100";
    case "active":
      return "tw-text-white tw-font-semibold";
    case "error":
      return "tw-text-red";
    case "idle":
      return "tw-text-iron-500";
  }
}

function getStepGlyph(status: StepStatus, index: number): string {
  switch (status) {
    case "done":
      return "✓";
    case "error":
      return "!";
    case "active":
    case "idle":
      return String(index + 1);
  }
}

function getStepLabelKey(step: ProfileCmsPublishStep): Parameters<typeof t>[1] {
  switch (step) {
    case "validate":
      return "profileCms.builder.publish.step.validate";
    case "upload":
      return "profileCms.builder.publish.step.upload";
    case "sign":
      return "profileCms.builder.publish.step.sign";
    case "publish":
      return "profileCms.builder.publish.step.publish";
  }
}

function getPublishErrorKey(
  code: Extract<ProfileCmsPublishResult, { ok: false }>["code"]
): Parameters<typeof t>[1] {
  switch (code) {
    case "server_validation_invalid":
      return "profileCms.builder.publish.error.validationInvalid";
    case "save_failed":
      return "profileCms.builder.publish.error.saveFailed";
    case "validate_failed":
      return "profileCms.builder.publish.error.validateFailed";
    case "upload_failed":
      return "profileCms.builder.publish.error.uploadFailed";
    case "signature_rejected":
      return "profileCms.builder.publish.error.signatureRejected";
    case "signature_failed":
      return "profileCms.builder.publish.error.signatureFailed";
    case "deadline_expired":
      return "profileCms.builder.publish.error.deadlineExpired";
    case "publish_conflict":
      return "profileCms.builder.publish.error.publishConflict";
    case "publish_failed":
      return "profileCms.builder.publish.error.publishFailed";
  }
}
