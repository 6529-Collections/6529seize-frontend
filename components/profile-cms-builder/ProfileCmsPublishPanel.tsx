"use client";

import { useEffect, useRef, useState } from "react";
import { publicEnv } from "@/config/env";

import { t } from "@/i18n/messages";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { useProfileCmsPublishSign } from "@/hooks/profile-cms/useProfileCmsPublishSign";
import {
  prepareProfileCmsPublish,
  signAndPublishProfileCms,
  type ProfileCmsPublishContext,
  type ProfileCmsPublishResult,
  type ProfileCmsPublishStep,
  type ProfileCmsUploadContext,
} from "@/lib/profile-cms/builder/publish";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import type { ProfileCmsPackageRecord } from "@/lib/profile-cms/builder/api";
import ProfileCmsRecoveryLink from "./ProfileCmsRecoveryLink";

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
  readonly primaryWallet?: string | undefined;
  readonly canUseBuilderApi: boolean;
  readonly canPublish: boolean;
  readonly locale?: SupportedLocale | undefined;
  readonly onPublished?:
    | ((published: ProfileCmsPackageRecord) => void)
    | undefined;
  readonly onBusyChange?: ((busy: boolean) => void) | undefined;
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
  ...props
}: ProfileCmsPublishPanelProps) {
  const signer = useProfileCmsPublishSign();
  return (
    <ProfileCmsPublishWorkspace
      key={`${props.profileId ?? "missing-profile"}:${props.cmsPackage.integrity.package_hash}:${props.primaryWallet ?? "missing-wallet"}:${signer.signerAddress ?? "disconnected"}:${signer.chainId}:${signer.isSafe}`}
      {...props}
      signer={signer}
    />
  );
}

function ProfileCmsPublishWorkspace({
  cmsPackage,
  profileId,
  primaryWallet,
  canUseBuilderApi,
  canPublish,
  locale = DEFAULT_LOCALE,
  onPublished,
  onBusyChange,
  signer,
}: ProfileCmsPublishPanelProps & {
  readonly signer: ReturnType<typeof useProfileCmsPublishSign>;
}) {
  const { signTypedData, chainId, signerAddress, isConnected, isSafe } = signer;
  const [state, setState] = useState<PublishState>(INITIAL_STATE);
  const attemptRef = useRef(0);
  useEffect(
    () => () => {
      attemptRef.current += 1;
      onBusyChange?.(false);
    },
    [onBusyChange]
  );

  const disabled =
    state.running ||
    !canUseBuilderApi ||
    !canPublish ||
    !profileId ||
    !isConnected ||
    !signerAddress;

  const updateProgress = (step: ProfileCmsPublishStep, attempt: number) => {
    if (attemptRef.current !== attempt) return;
    setState((current) => ({
      ...current,
      reachedStep: PUBLISH_STEPS.indexOf(step) - 1,
    }));
  };

  const runFullPublish = async (uploadContext?: ProfileCmsUploadContext) => {
    if (disabled || !profileId || !signerAddress) {
      return;
    }
    setState({ ...INITIAL_STATE, running: true });
    onBusyChange?.(true);
    const attempt = ++attemptRef.current;
    const isCurrent = () => attempt === attemptRef.current;

    const prepared = await prepareProfileCmsPublish({
      uploadContext,
      primaryWallet,
      onStep: (step) => updateProgress(step, attempt),
      cmsPackage,
      profileId,
      chainId,
      signerAddress,
      signTypedData,
      isSafe,
      isCurrent,
    });
    if (!isCurrent()) return;
    if (!prepared.ok) {
      onBusyChange?.(false);
      setState({
        running: false,
        result: prepared,
        context: prepared.context ?? null,
        reachedStep: getReachedStepFromFailure(prepared.step, false),
      });
      return;
    }

    const result = await signAndPublishProfileCms({
      onStep: (step) => updateProgress(step, attempt),
      context: prepared.context,
      baseUrl: publicEnv.BASE_ENDPOINT,
      chainId,
      signerAddress,
      signTypedData,
      isSafe,
      isCurrent,
    });
    if (isCurrent()) finishAttempt(result, prepared.context);
  };

  // Retry the sign + publish tail with a fresh deadline, reusing the receipt.
  const retrySignAndPublish = async () => {
    if (disabled || !state.context || !signerAddress) {
      return;
    }
    setState((current) => ({ ...current, running: true, result: null }));
    onBusyChange?.(true);
    const attempt = ++attemptRef.current;
    const isCurrent = () => attempt === attemptRef.current;
    const result = await signAndPublishProfileCms({
      onStep: (step) => updateProgress(step, attempt),
      context: state.context,
      baseUrl: publicEnv.BASE_ENDPOINT,
      chainId,
      signerAddress,
      signTypedData,
      isSafe,
      isCurrent,
      signedRequest:
        state.result && !state.result.ok
          ? state.result.signedRequest
          : undefined,
    });
    if (isCurrent()) finishAttempt(result, state.context);
  };

  const finishAttempt = (
    result: ProfileCmsPublishResult,
    context: ProfileCmsPublishContext
  ) => {
    onBusyChange?.(false);
    if (result.ok) {
      setState({
        running: false,
        result,
        context,
        reachedStep: PUBLISH_STEPS.length,
      });
      onPublished?.(result.published);
      return;
    }
    setState({
      running: false,
      result,
      context: result.context ?? null,
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
          className="tw-min-h-10 tw-border tw-border-solid tw-border-primary-400 tw-bg-primary-600 tw-px-3 tw-text-sm tw-font-semibold tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          disabled={disabled || canRetryPublish(state)}
          onClick={() => void runFullPublish()}
          type="button"
        >
          {state.running
            ? t(locale, "profileCms.builder.publish.publishing")
            : t(locale, "profileCms.builder.publish.publish")}
        </button>
        {canRetryPublish(state) ? (
          <button
            className="tw-min-h-10 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-100 hover:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
            disabled={disabled}
            onClick={() => {
              if (
                state.result &&
                !state.result.ok &&
                state.result.uploadContext
              )
                void runFullPublish(state.result.uploadContext);
              else void retrySignAndPublish();
            }}
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
          {t(
            locale,
            result.isCurrent === false
              ? "profileCms.builder.publish.savedNotCurrent"
              : "profileCms.builder.publish.success"
          )}
        </p>
        <a
          className="tw-mt-2 tw-inline-block tw-break-all tw-font-mono tw-text-xs tw-text-green tw-underline"
          href={result.publishedUrl}
          rel="noreferrer"
          target="_blank"
        >
          {result.publishedUrl}
        </a>
        <ProfileCmsRecoveryLink
          receipt={result.published.recoveryReceipt}
          locale={locale}
        />
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
    <li
      className="tw-flex tw-items-center tw-gap-3"
      aria-current={status === "active" ? "step" : undefined}
    >
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

function canRetryPublish(state: PublishState): boolean {
  return (
    !state.running &&
    state.result !== null &&
    !state.result.ok &&
    (state.context !== null || state.result.uploadContext !== undefined)
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
    case "storage_pending":
      return "profileCms.builder.publish.error.storagePending";
  }
}
