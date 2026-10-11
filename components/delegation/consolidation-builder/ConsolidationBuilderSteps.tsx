"use client";

import Button from "@/components/utils/button/Button";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { ReactNode } from "react";
import type {
  ConsolidationStepProgress,
  ConsolidationStepStatus,
} from "./consolidation-plan";

export type ConsolidationStepsState =
  | { readonly kind: "incomplete" }
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "groupError" }
  | {
      readonly kind: "ready";
      readonly steps: readonly ConsolidationStepProgress[];
    };

interface StepContext {
  readonly locale: SupportedLocale;
  readonly activationDate: string;
  readonly walletResolving: boolean;
  readonly isBusy: boolean;
  readonly busySigner: string | undefined;
  readonly gasError: string | undefined;
  readonly gasErrorSigner: string | undefined;
  readonly getWalletLabel: (wallet: string) => string;
  readonly getDisplayAddress: (wallet: string) => string;
  readonly onSign: (step: ConsolidationStepProgress) => void;
  readonly onConnect: () => void;
}

const STATUS_STYLES: Record<
  ConsolidationStepStatus,
  { readonly item: string; readonly badge: string }
> = {
  complete: {
    item: "tw-border-white/[0.06] tw-bg-black/20",
    badge: "tw-border-success/40 tw-bg-success/10 tw-text-success",
  },
  recording: {
    item: "tw-border-white/[0.06] tw-bg-black/20",
    badge: "tw-border-primary-400/30 tw-bg-primary-500/10 tw-text-primary-200",
  },
  current: {
    item: "tw-border-primary-400/50 tw-bg-primary-500/[0.06]",
    badge: "tw-border-primary-400/50 tw-bg-primary-500/15 tw-text-primary-200",
  },
  upcoming: {
    item: "tw-border-white/[0.06] tw-bg-black/20",
    badge: "tw-border-white/10 tw-bg-white/[0.05] tw-text-iron-300",
  },
};

const STATUS_MESSAGE_KEYS = {
  complete: "delegation.consolidationBuilder.steps.status.complete",
  recording: "delegation.consolidationBuilder.steps.status.recording",
  current: "delegation.consolidationBuilder.steps.status.current",
  upcoming: "delegation.consolidationBuilder.steps.status.upcoming",
} as const satisfies Record<ConsolidationStepStatus, string>;

const MESSAGE_CLASS_NAME = "tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300";

function getStepHint(
  step: ConsolidationStepProgress,
  context: StepContext
): string | undefined {
  const { locale } = context;
  const walletParams = {
    wallet: context.getWalletLabel(step.signer),
    address: context.getDisplayAddress(step.signer),
  };
  switch (step.block) {
    case "fourth-slot":
      return t(
        locale,
        "delegation.consolidationBuilder.steps.hint.fourthSlot",
        {
          date: context.activationDate,
        }
      );
    case "disconnected":
      return context.walletResolving
        ? t(locale, "delegation.consolidationBuilder.steps.hint.resolving")
        : t(
            locale,
            "delegation.consolidationBuilder.steps.hint.disconnected",
            walletParams
          );
    case "wrong-wallet":
      return t(
        locale,
        "delegation.consolidationBuilder.steps.hint.wrongWallet",
        walletParams
      );
    case "earlier-steps":
      return t(
        locale,
        "delegation.consolidationBuilder.steps.hint.earlierSteps"
      );
    case undefined:
      return undefined;
  }
}

function getRegistrationCountLabel(
  locale: SupportedLocale,
  count: number
): string {
  return count === 1
    ? t(locale, "delegation.consolidationBuilder.steps.oneRegistration")
    : t(locale, "delegation.consolidationBuilder.steps.batchRegistrations", {
        count: formatInteger(locale, count),
      });
}

function StepAction(
  props: Readonly<{ step: ConsolidationStepProgress; context: StepContext }>
) {
  const { step, context } = props;
  const { locale } = context;
  const stepNumber = formatInteger(locale, step.index + 1);

  if (step.status === "complete") {
    return null;
  }
  if (step.status === "recording") {
    return (
      <p className={MESSAGE_CLASS_NAME}>
        {t(locale, "delegation.consolidationBuilder.steps.hint.recording")}
      </p>
    );
  }
  if (step.canSign) {
    return (
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="tw-whitespace-normal"
        loading={context.busySigner === step.signer}
        disabled={context.isBusy}
        onClick={() => context.onSign(step)}
      >
        {t(locale, "delegation.consolidationBuilder.steps.sign", {
          step: stepNumber,
        })}
      </Button>
    );
  }

  const showConnect = step.block === "disconnected" && !context.walletResolving;
  return (
    <>
      <p className={MESSAGE_CLASS_NAME}>{getStepHint(step, context)}</p>
      {showConnect && (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={context.onConnect}
        >
          {t(locale, "delegation.consolidationBuilder.steps.connect")}
        </Button>
      )}
    </>
  );
}

function StepItem(
  props: Readonly<{ step: ConsolidationStepProgress; context: StepContext }>
) {
  const { step, context } = props;
  const { locale } = context;
  const styles = STATUS_STYLES[step.status];
  const headingId = `consolidation-step-${step.index}`;
  const registrations =
    step.status === "current" || step.status === "upcoming"
      ? step.pendingTargets
      : step.targets;
  const showGasError =
    !!context.gasError && context.gasErrorSigner === step.signer;

  return (
    <li
      aria-labelledby={headingId}
      aria-current={step.status === "current" ? "step" : undefined}
      className={`tw-rounded-lg tw-border tw-border-solid tw-p-4 ${styles.item}`}
    >
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-2">
        <div className="tw-min-w-0">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
            {t(locale, "delegation.consolidationBuilder.steps.step", {
              step: formatInteger(locale, step.index + 1),
            })}
          </p>
          <h4
            id={headingId}
            className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100"
          >
            {t(locale, "delegation.consolidationBuilder.steps.signs", {
              wallet: context.getWalletLabel(step.signer),
            })}
          </h4>
          <p className="tw-m-0 tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-400">
            {context.getDisplayAddress(step.signer)}
          </p>
        </div>
        <span
          className={`tw-inline-flex tw-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-leading-5 ${styles.badge}`}
        >
          {t(locale, STATUS_MESSAGE_KEYS[step.status])}
        </span>
      </div>
      <p className={`${MESSAGE_CLASS_NAME} tw-mt-3`}>
        {t(locale, "delegation.consolidationBuilder.steps.linksTo", {
          wallets: formatList(locale, step.targets.map(context.getWalletLabel)),
        })}
      </p>
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-500">
        {getRegistrationCountLabel(locale, registrations.length)}
      </p>
      {step.status !== "complete" && (
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <StepAction step={step} context={context} />
        </div>
      )}
      {showGasError && (
        <p
          role="alert"
          className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-error"
        >
          {context.gasError}
        </p>
      )}
    </li>
  );
}

function StepsBody(
  props: Readonly<{
    state: ConsolidationStepsState;
    context: StepContext;
    onRetry: () => void;
  }>
) {
  const { state, context, onRetry } = props;
  const { locale } = context;

  switch (state.kind) {
    case "incomplete":
      return (
        <p className={MESSAGE_CLASS_NAME}>
          {t(locale, "delegation.consolidationBuilder.steps.incomplete")}
        </p>
      );
    case "loading":
      return (
        <output className={`tw-block ${MESSAGE_CLASS_NAME}`}>
          {t(locale, "delegation.consolidationBuilder.steps.loading")}
        </output>
      );
    case "error":
      return (
        <div
          role="alert"
          className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-text-sm tw-leading-6 tw-text-error"
        >
          <span>
            {t(locale, "delegation.consolidationBuilder.steps.readError")}
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            {t(locale, "delegation.consolidationBuilder.retry")}
          </Button>
        </div>
      );
    case "groupError":
      return (
        <p className={MESSAGE_CLASS_NAME}>
          {t(locale, "delegation.consolidationBuilder.steps.groupError")}
        </p>
      );
    case "ready":
      break;
  }

  if (state.steps.length === 0) {
    return (
      <p className={MESSAGE_CLASS_NAME}>
        {t(locale, "delegation.consolidationBuilder.steps.nothingToDo")}
      </p>
    );
  }

  const allComplete = state.steps.every((step) => step.status === "complete");
  return (
    <>
      <ol className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
        {state.steps.map((step) => (
          <StepItem key={step.signer} step={step} context={context} />
        ))}
      </ol>
      {allComplete && (
        <p className={`${MESSAGE_CLASS_NAME} tw-mt-4`}>
          {t(locale, "delegation.consolidationBuilder.steps.allComplete")}
        </p>
      )}
    </>
  );
}

/**
 * Text for the steps' persistent live region: the next step and its signer,
 * a confirmed step waiting to be recorded, or completion.
 */
function getProgressAnnouncement(
  state: ConsolidationStepsState,
  context: StepContext
): string {
  if (state.kind !== "ready" || state.steps.length === 0) {
    return "";
  }
  const { locale } = context;
  const current = state.steps.find((step) => step.status === "current");
  if (current) {
    return t(locale, "delegation.consolidationBuilder.steps.progress.current", {
      step: formatInteger(locale, current.index + 1),
      total: formatInteger(locale, state.steps.length),
      wallet: context.getWalletLabel(current.signer),
    });
  }
  const recording = state.steps.find((step) => step.status === "recording");
  if (recording) {
    return t(
      locale,
      "delegation.consolidationBuilder.steps.progress.recording",
      { step: formatInteger(locale, recording.index + 1) }
    );
  }
  return t(locale, "delegation.consolidationBuilder.steps.allComplete");
}

/** Numbered signing steps; only the next step's signer can act. */
export function ConsolidationBuilderSteps(
  props: Readonly<
    StepContext & {
      state: ConsolidationStepsState;
      onRetry: () => void;
      children?: ReactNode;
    }
  >
) {
  const { state, onRetry, children, ...context } = props;
  return (
    <section aria-labelledby="consolidation-builder-steps">
      <h3
        id="consolidation-builder-steps"
        className="tw-mb-1 tw-mt-0 tw-text-base tw-font-semibold tw-text-iron-100"
      >
        {t(context.locale, "delegation.consolidationBuilder.steps.title")}
      </h3>
      <p className="tw-mb-4 tw-mt-0 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(context.locale, "delegation.consolidationBuilder.steps.description")}
      </p>
      {children}
      <StepsBody state={state} context={context} onRetry={onRetry} />
      <output aria-atomic="true" className="tw-sr-only">
        {getProgressAnnouncement(state, context)}
      </output>
    </section>
  );
}
