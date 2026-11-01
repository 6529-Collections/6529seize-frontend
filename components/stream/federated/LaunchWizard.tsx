"use client";

import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import { useStream } from "@/components/stream/data/StreamProvider";
import {
  DetailsFields,
  FormChoice,
} from "@/components/stream/federated/LaunchFields";
import {
  type Deployed,
  FirstSalePanel,
  IdentityPanel,
  RegisteredPanel,
  ReviewPanel,
} from "@/components/stream/federated/LaunchPanels";
import {
  EMPTY_DETAILS,
  type LaunchDetails,
  toDeployRequest,
  validateDetails,
} from "@/components/stream/federated/launchForm";
import { PageHeader, useStreamAction } from "@/components/stream/pages/common";
import { txErrorMessage } from "@/components/stream/ui/GasNote";
import {
  STREAM_BUTTON_PRIMARY,
  STREAM_BUTTON_SECONDARY,
  STREAM_CARD,
  STREAM_FOCUS,
  STREAM_HEADING,
  STREAM_HELP,
  STREAM_LABEL,
  STREAM_TEXT,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { FederatedForm } from "@/lib/stream/types";

/**
 * /stream/launch: an artist deploys a federated contract (v1.1 design), one
 * step at a time. Each step has one sentence and one action; errors show
 * inline under the field that caused them.
 */

const STEPS = [
  "form",
  "identity",
  "details",
  "deploy",
  "registered",
  "sell",
] as const;

type StepId = (typeof STEPS)[number];

/** Steps before the deploy can go back; after it the contract exists. */
const DEPLOY_STEP = STEPS.indexOf("deploy");

function Progress({
  current,
  locale,
}: {
  readonly current: number;
  readonly locale: SupportedLocale;
}) {
  return (
    <ol
      aria-label={t(locale, "stream.launch.progress")}
      className="tw-m-0 tw-mb-4 tw-grid tw-list-none tw-grid-cols-6 tw-gap-1.5 tw-p-0"
    >
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className="tw-min-w-0"
        >
          <span
            aria-hidden="true"
            className={`tw-block tw-h-1 tw-rounded-sm ${index <= current ? "tw-bg-primary-400" : "tw-bg-iron-800"}`}
          />
          <span
            className={`tw-sr-only tw-mt-2 tw-truncate tw-text-xs sm:tw-not-sr-only sm:tw-block ${index === current ? "tw-text-iron-50" : "tw-text-iron-400"}`}
          >
            {t(locale, `stream.launch.step.${step}.title`)}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** One step: its number, title, one sentence, the controls and one action. */
function StepFrame({
  step,
  locale,
  headingRef,
  children,
  onBack,
  action,
}: {
  readonly step: number;
  readonly locale: SupportedLocale;
  readonly headingRef: RefObject<HTMLHeadingElement | null>;
  readonly children: ReactNode;
  readonly onBack?: (() => void) | undefined;
  readonly action: ReactNode;
}) {
  const id = STEPS[step] ?? "form";
  return (
    <section
      aria-labelledby={`launch-step-${id}`}
      className={`${STREAM_CARD} tw-p-4 sm:tw-p-6`}
    >
      <p className={STREAM_LABEL}>
        {t(locale, "stream.launch.stepOf", {
          step: formatInteger(locale, step + 1),
          total: formatInteger(locale, STEPS.length),
        })}
      </p>
      <h2
        id={`launch-step-${id}`}
        ref={headingRef}
        tabIndex={-1}
        className={`${STREAM_HEADING} tw-mt-1 tw-text-xl ${STREAM_FOCUS}`}
      >
        {t(locale, `stream.launch.step.${id}.title`)}
      </h2>
      <p className={`${STREAM_TEXT} tw-mt-1`}>
        {t(locale, `stream.launch.step.${id}.line`)}
      </p>
      <div className="tw-mt-5">{children}</div>
      {action === null && onBack === undefined ? null : (
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          {action}
          {onBack === undefined ? null : (
            <button
              type="button"
              onClick={onBack}
              className={STREAM_BUTTON_SECONDARY}
            >
              {t(locale, "stream.launch.back")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

interface WizardState {
  readonly form: FederatedForm | null;
  readonly details: LaunchDetails;
  readonly showErrors: boolean;
  readonly deployed: Deployed | null;
}

/** Whether the step's input lets the artist continue. */
function stepIsValid(
  step: StepId,
  state: WizardState,
  hasAccount: boolean,
  locale: SupportedLocale
): boolean {
  if (step === "form") {
    return state.form !== null;
  }
  if (step === "identity") {
    return hasAccount;
  }
  if (step === "details") {
    return (
      state.form !== null &&
      Object.keys(validateDetails(state.form, state.details, locale)).length ===
        0
    );
  }
  return true;
}

/** The controls of the current step. */
function StepBody({
  step,
  state,
  locale,
  onForm,
  onDetails,
}: {
  readonly step: StepId;
  readonly state: WizardState;
  readonly locale: SupportedLocale;
  readonly onForm: (form: FederatedForm) => void;
  readonly onDetails: (patch: Partial<LaunchDetails>) => void;
}) {
  const { form, details, showErrors, deployed } = state;
  if (step === "form") {
    return (
      <FormChoice
        form={form}
        onChange={onForm}
        showError={showErrors && form === null}
        locale={locale}
      />
    );
  }
  if (step === "identity") {
    return <IdentityPanel showError={showErrors} locale={locale} />;
  }
  if (form !== null && step === "details") {
    return (
      <DetailsFields
        form={form}
        details={details}
        errors={showErrors ? validateDetails(form, details, locale) : {}}
        onChange={onDetails}
        locale={locale}
      />
    );
  }
  if (form !== null && step === "deploy") {
    return <ReviewPanel form={form} details={details} locale={locale} />;
  }
  if (deployed !== null && step === "registered") {
    return <RegisteredPanel deployed={deployed} locale={locale} />;
  }
  if (deployed !== null && step === "sell") {
    return <FirstSalePanel deployed={deployed} locale={locale} />;
  }
  return null;
}

function StepAction({
  step,
  pending,
  locale,
}: {
  readonly step: StepId;
  readonly pending: boolean;
  readonly locale: SupportedLocale;
}) {
  if (step === "deploy") {
    return (
      <button
        type="submit"
        disabled={pending}
        className={STREAM_BUTTON_PRIMARY}
      >
        {t(
          locale,
          pending ? "stream.launch.deploying" : "stream.launch.deploy"
        )}
      </button>
    );
  }
  return (
    <button type="submit" className={STREAM_BUTTON_PRIMARY}>
      {t(locale, "stream.launch.continue")}
    </button>
  );
}

export function LaunchWizard() {
  const locale = useBrowserLocale();
  const { account } = useStream();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    form: null,
    details: EMPTY_DETAILS,
    showErrors: false,
    deployed: null,
  });
  const [deployError, setDeployError] = useState<string | null>(null);
  const { run, pending } = useStreamAction(locale);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    // Focus the new step's heading after a move, not on the first render.
    if (moved.current) {
      headingRef.current?.focus();
    }
  }, [step]);

  const current: StepId = STEPS[step] ?? "form";

  function goTo(target: number) {
    moved.current = true;
    setState((value) => ({ ...value, showErrors: false }));
    setDeployError(null);
    setStep(Math.min(Math.max(target, 0), STEPS.length - 1));
  }

  async function deploy(form: FederatedForm) {
    setDeployError(null);
    const result = await run((actions, from) =>
      actions.deployFederated(
        from,
        toDeployRequest(form, state.details, locale)
      )
    );
    if (result === null) {
      setDeployError(t(locale, "stream.launch.identity.noWallet"));
    } else if (result.ok) {
      setState((value) => ({
        ...value,
        deployed: { ...result.value, hash: result.hash, gas: result.gas },
      }));
      goTo(step + 1);
    } else {
      setDeployError(txErrorMessage(locale, result.error));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stepIsValid(current, state, account !== null, locale)) {
      setState((value) => ({ ...value, showErrors: true }));
      return;
    }
    if (current === "deploy" && state.form !== null) {
      void deploy(state.form);
      return;
    }
    goTo(step + 1);
  }

  const canGoBack = step > 0 && step <= DEPLOY_STEP && !pending;
  const frame = (
    <StepFrame
      step={step}
      locale={locale}
      headingRef={headingRef}
      onBack={canGoBack ? () => goTo(step - 1) : undefined}
      action={
        current === "sell" ? null : (
          <StepAction step={current} pending={pending} locale={locale} />
        )
      }
    >
      <StepBody
        step={current}
        state={state}
        locale={locale}
        onForm={(form) =>
          setState((value) => ({ ...value, form, showErrors: false }))
        }
        onDetails={(patch) =>
          setState((value) => ({
            ...value,
            details: { ...value.details, ...patch },
          }))
        }
      />
      {deployError === null ? null : (
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-text-error" role="alert">
          {deployError}
        </p>
      )}
    </StepFrame>
  );

  return (
    <div className="tw-mx-auto tw-max-w-3xl">
      <PageHeader
        title={t(locale, "stream.launch.title")}
        intro={t(locale, "stream.launch.intro")}
      >
        <p className={`${STREAM_HELP} tw-mt-2`}>
          {t(locale, "stream.federated.notCurated")}
        </p>
      </PageHeader>
      <Progress current={step} locale={locale} />
      {current === "sell" ? (
        // The sale panel is its own form (and carries the step's one action);
        // forms must not nest.
        frame
      ) : (
        <form noValidate onSubmit={submit}>
          {frame}
        </form>
      )}
    </div>
  );
}
