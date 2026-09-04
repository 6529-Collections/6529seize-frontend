"use client";

import { useRef, useState } from "react";

import { usePublicReviewFeedbackPanelCoordination } from "@/components/public-review/PublicReviewReadingLayout";
import { formatInteger, formatNumber, formatPercent } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type PreviewStepId = "artwork" | "plan" | "approval" | "collector" | "history";

type PreviewStep = {
  readonly id: PreviewStepId;
  readonly headingKey: MessageKey;
  readonly labelKey: MessageKey;
};

const PREVIEW_STEPS = [
  {
    id: "artwork",
    headingKey: "publicReview.conceptPreview.artwork.heading",
    labelKey: "publicReview.conceptPreview.steps.artwork",
  },
  {
    id: "plan",
    headingKey: "publicReview.conceptPreview.plan.heading",
    labelKey: "publicReview.conceptPreview.steps.plan",
  },
  {
    id: "approval",
    headingKey: "publicReview.conceptPreview.approval.heading",
    labelKey: "publicReview.conceptPreview.steps.approval",
  },
  {
    id: "collector",
    headingKey: "publicReview.conceptPreview.collector.heading",
    labelKey: "publicReview.conceptPreview.steps.collector",
  },
  {
    id: "history",
    headingKey: "publicReview.conceptPreview.history.heading",
    labelKey: "publicReview.conceptPreview.steps.history",
  },
] as const satisfies readonly PreviewStep[];

const PREVIEW_EDITION_NUMBER = formatInteger(DEFAULT_LOCALE, 1);
const PREVIEW_PRICE = formatNumber(DEFAULT_LOCALE, 1, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const PREVIEW_ARTIST_SHARE = formatPercent(DEFAULT_LOCALE, 0.9, 0);
const PREVIEW_STUDIO_SHARE = formatPercent(DEFAULT_LOCALE, 0.1, 0);

/** Renders the fictional artwork used throughout the concept preview. */
function ArtworkVisual() {
  return (
    <div
      aria-label={t(
        DEFAULT_LOCALE,
        "publicReview.conceptPreview.artwork.visualDescription"
      )}
      className="tw-relative tw-isolate tw-aspect-[4/3] tw-w-full tw-overflow-hidden tw-bg-black @3xl:tw-aspect-square"
      role="img"
    >
      <div
        aria-hidden="true"
        className="tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_20%_18%,rgba(82,139,255,0.58),transparent_30%),radial-gradient(circle_at_78%_74%,rgba(132,173,255,0.24),transparent_32%),linear-gradient(145deg,#07080b_0%,#121622_52%,#07080c_100%)]"
      />
      <div
        aria-hidden="true"
        className="tw-absolute -tw-left-[12%] tw-top-[18%] tw-h-[58%] tw-w-[72%] -tw-rotate-12 tw-rounded-[38%] tw-border tw-border-solid tw-border-primary-300/50 tw-bg-primary-500/10 tw-shadow-[0_0_80px_rgba(82,139,255,0.20)] tw-backdrop-blur-3xl"
      />
      <div
        aria-hidden="true"
        className="tw-absolute tw-right-[8%] tw-top-[10%] tw-h-[76%] tw-w-[42%] tw-rotate-12 tw-rounded-full tw-border tw-border-solid tw-border-white/20 tw-bg-white/[0.025]"
      />
      <div
        aria-hidden="true"
        className="tw-absolute tw-left-[17%] tw-top-[16%] tw-h-[68%] tw-w-px tw-rotate-[24deg] tw-bg-white/70 tw-shadow-[0_0_18px_rgba(255,255,255,0.5)]"
      />
      <div
        aria-hidden="true"
        className="tw-absolute tw-bottom-[22%] tw-left-[8%] tw-h-px tw-w-[76%] -tw-rotate-6 tw-bg-primary-300/75 tw-shadow-[0_0_20px_rgba(82,139,255,0.55)]"
      />
      <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-flex tw-items-end tw-justify-between tw-gap-4 tw-bg-gradient-to-t tw-from-black/85 tw-to-transparent tw-p-5 sm:tw-p-6">
        <span className="tw-font-mono tw-text-[0.62rem] tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-iron-200">
          {t(DEFAULT_LOCALE, "publicReview.conceptPreview.artwork.seriesLabel")}
        </span>
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/15 tw-bg-black/40 tw-px-2.5 tw-py-1 tw-font-mono tw-text-[0.62rem] tw-font-semibold tw-text-white">
          {t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.artwork.editionLabel",
            {
              current: PREVIEW_EDITION_NUMBER,
              total: PREVIEW_EDITION_NUMBER,
            }
          )}
        </span>
      </div>
    </div>
  );
}

/** Renders the short explanation and takeaway for one preview step. */
function PreviewPanel({
  heading,
  description,
  takeaway,
}: {
  readonly heading: string;
  readonly description: string;
  readonly takeaway: string;
}) {
  return (
    <div>
      <h3 className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
        {heading}
      </h3>
      <p className="tw-mb-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300">
        {description}
      </p>
      <p className="tw-mb-0 tw-mt-6 tw-rounded-lg tw-bg-white/[0.04] tw-p-4 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
        {takeaway}
      </p>
    </div>
  );
}

/** Selects the panel content for the active preview step. */
function PreviewView({ stepId }: { readonly stepId: PreviewStepId }) {
  switch (stepId) {
    case "artwork":
      return (
        <PreviewPanel
          description={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.artwork.description"
          )}
          heading={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.artwork.heading"
          )}
          takeaway={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.artwork.takeaway"
          )}
        />
      );
    case "plan":
      return (
        <PreviewPanel
          description={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.plan.description",
            { price: PREVIEW_PRICE }
          )}
          heading={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.plan.heading"
          )}
          takeaway={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.plan.takeaway",
            {
              artistShare: PREVIEW_ARTIST_SHARE,
              studioShare: PREVIEW_STUDIO_SHARE,
            }
          )}
        />
      );
    case "approval":
      return (
        <PreviewPanel
          description={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.approval.description"
          )}
          heading={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.approval.heading"
          )}
          takeaway={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.approval.takeaway"
          )}
        />
      );
    case "collector":
      return (
        <PreviewPanel
          description={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.collector.description"
          )}
          heading={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.collector.heading"
          )}
          takeaway={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.collector.takeaway",
            {
              current: PREVIEW_EDITION_NUMBER,
              price: PREVIEW_PRICE,
              total: PREVIEW_EDITION_NUMBER,
            }
          )}
        />
      );
    case "history":
      return (
        <PreviewPanel
          description={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.history.description"
          )}
          heading={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.history.heading"
          )}
          takeaway={t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.history.takeaway"
          )}
        />
      );
  }
}

/** Walks reviewers through one fictional artwork without live actions. */
export function StreamArtworkConceptPreview() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const stepButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const feedbackPanel = usePublicReviewFeedbackPanelCoordination();
  const activeStep = PREVIEW_STEPS[activeStepIndex] ?? PREVIEW_STEPS[0];
  const previousStep = PREVIEW_STEPS[activeStepIndex - 1];
  const nextStep = PREVIEW_STEPS[activeStepIndex + 1];

  return (
    <section
      aria-labelledby="stream-concept-preview-heading"
      className="tw-mt-12 tw-scroll-mt-24 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.09] tw-bg-[#101014] tw-@container sm:tw-mt-16"
      id="stream-artwork-concept-preview"
    >
      <header className="tw-p-5 sm:tw-p-7">
        <p className="tw-m-0 tw-font-mono tw-text-[0.64rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
          {t(DEFAULT_LOCALE, "publicReview.conceptPreview.entry.eyebrow")}
        </p>
        <h2
          id="stream-concept-preview-heading"
          className="tw-mb-0 tw-mt-3 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl"
        >
          {t(DEFAULT_LOCALE, "publicReview.conceptPreview.heading")}
        </h2>
        <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.conceptPreview.description")}
        </p>
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
          {t(DEFAULT_LOCALE, "publicReview.conceptPreview.disclaimer")}
        </p>
      </header>

      <nav
        aria-label={t(
          DEFAULT_LOCALE,
          "publicReview.conceptPreview.navigationLabel"
        )}
        className="tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-bg-black/20 tw-p-2 sm:tw-p-3"
      >
        <ol className="tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-2 tw-p-0 @lg:tw-grid-cols-3 @3xl:tw-grid-cols-5">
          {PREVIEW_STEPS.map((step, index) => {
            const isActive = index === activeStepIndex;
            return (
              <li key={step.id}>
                <button
                  aria-controls="stream-concept-preview-view"
                  aria-current={isActive ? "step" : undefined}
                  className={`tw-flex tw-min-h-12 tw-w-full tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300 motion-reduce:tw-transition-none ${
                    isActive
                      ? "tw-border-primary-400/45 tw-bg-primary-500/15 tw-text-white"
                      : "tw-border-white/[0.06] tw-bg-white/[0.02] tw-text-iron-400 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-iron-100"
                  }`}
                  onClick={() => setActiveStepIndex(index)}
                  ref={(element) => {
                    stepButtonRefs.current[index] = element;
                  }}
                  type="button"
                >
                  <span className="tw-font-mono tw-text-[0.62rem] tw-text-primary-300">
                    {formatInteger(DEFAULT_LOCALE, index + 1)}
                  </span>
                  <span>{t(DEFAULT_LOCALE, step.labelKey)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <output className="tw-mb-0 tw-block tw-px-5 tw-pt-5 tw-font-mono tw-text-[0.64rem] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300 sm:tw-px-7 lg:tw-px-8">
        {t(DEFAULT_LOCALE, "publicReview.conceptPreview.stepStatus", {
          current: formatInteger(DEFAULT_LOCALE, activeStepIndex + 1),
          heading: t(DEFAULT_LOCALE, activeStep.headingKey),
          total: formatInteger(DEFAULT_LOCALE, PREVIEW_STEPS.length),
        })}
      </output>

      <section
        aria-label={t(DEFAULT_LOCALE, activeStep.headingKey)}
        className="tw-grid @3xl:tw-grid-cols-[minmax(0,1.04fr)_minmax(20rem,0.96fr)]"
        id="stream-concept-preview-view"
      >
        <ArtworkVisual />
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-p-5 sm:tw-p-7 lg:tw-p-8">
          <div className="tw-flex-1">
            <PreviewView stepId={activeStep.id} />
          </div>
          <div className="tw-mt-7 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-5">
            {previousStep ? (
              <button
                className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
                onClick={() => {
                  const targetIndex = activeStepIndex - 1;
                  setActiveStepIndex(targetIndex);
                  stepButtonRefs.current[targetIndex]?.focus();
                }}
                type="button"
              >
                {t(DEFAULT_LOCALE, "publicReview.conceptPreview.back", {
                  step: t(DEFAULT_LOCALE, previousStep.labelKey),
                })}
              </button>
            ) : (
              <span aria-hidden="true" />
            )}
            {nextStep ? (
              <button
                className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/45 tw-bg-primary-500/10 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300 desktop-hover:hover:tw-bg-primary-500/20 motion-reduce:tw-transition-none"
                onClick={() => {
                  const targetIndex = activeStepIndex + 1;
                  setActiveStepIndex(targetIndex);
                  stepButtonRefs.current[targetIndex]?.focus();
                }}
                type="button"
              >
                {t(DEFAULT_LOCALE, "publicReview.conceptPreview.next", {
                  step: t(DEFAULT_LOCALE, nextStep.labelKey),
                })}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="stream-concept-preview-feedback-heading"
        className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-bg-black/20 tw-p-5 sm:tw-p-7"
      >
        <h3
          id="stream-concept-preview-feedback-heading"
          className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
        >
          {t(DEFAULT_LOCALE, "publicReview.conceptPreview.feedback.heading")}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(
            DEFAULT_LOCALE,
            "publicReview.conceptPreview.feedback.description"
          )}
        </p>
        <a
          className="tw-mt-5 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300 desktop-hover:hover:tw-text-white"
          href="#public-review-feedback"
          onClick={() => feedbackPanel.open()}
        >
          {t(DEFAULT_LOCALE, "publicReview.conceptPreview.feedback.action")}
          <span aria-hidden="true">→</span>
        </a>
      </section>
    </section>
  );
}
