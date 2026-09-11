import { useState } from "react";
import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { formatInteger } from "@/i18n/format";
import type { CmsAgentDocumentReview } from "@/lib/profile-cms/agent-review";
import type { CmsPackageV1 } from "@/lib/profile-cms/protocol/v1";
import { StudioButton, StudioSelect } from "../studio/StudioControls";

export default function CmsAgentDocumentReviewPanel({
  base,
  review,
  locale,
  disabled,
  acceptLabel,
  onAccept,
  onDismiss,
}: {
  readonly base: CmsPackageV1;
  readonly review: CmsAgentDocumentReview;
  readonly locale: SupportedLocale;
  readonly disabled: boolean;
  readonly acceptLabel: string;
  readonly onAccept: () => void;
  readonly onDismiss: () => void;
}) {
  const [side, setSide] = useState("after");
  const [pageId, setPageId] = useState(
    review.cmsPackage.payload.pages[0]?.id ?? ""
  );
  const document = side === "before" ? base : review.cmsPackage;
  const page =
    document.payload.pages.find((item) => item.id === pageId) ??
    document.payload.pages[0];
  return (
    <section className="tw-space-y-5 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4 sm:tw-p-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-text-white">
          {t(locale, "profileCms.agent.reviewTitle")}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-300">
          {review.summary}
        </p>
        <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "profileCms.agent.summarySource")}
        </p>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
        <StudioButton
          active={side === "before"}
          onClick={() => setSide("before")}
        >
          {t(locale, "profileCms.agent.before")}
        </StudioButton>
        <StudioButton
          active={side === "after"}
          onClick={() => setSide("after")}
        >
          {t(locale, "profileCms.agent.after")}
        </StudioButton>
        <StudioSelect
          label={t(locale, "profileCms.agent.previewPage")}
          value={page?.id ?? ""}
          onChange={setPageId}
          options={document.payload.pages.map((item) => ({
            value: item.id,
            label: item.metadata.title,
          }))}
        />
      </div>
      {page ? (
        <div className="tw-max-h-[70dvh] tw-overflow-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-700">
          <CmsSiteRenderer
            cmsPackage={document}
            page={page}
            locale={locale}
            editing={{ onNavigatePage: setPageId }}
          />
        </div>
      ) : null}
      <details className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-3">
        <summary className="tw-cursor-pointer tw-text-sm tw-font-medium tw-text-iron-100">
          {t(locale, "profileCms.agent.exactChanges", {
            count: formatInteger(locale, review.changes.length),
          })}
        </summary>
        <div className="tw-mt-4 tw-space-y-4">
          {review.changes.map((change) => (
            <section key={change.path}>
              <h4 className="tw-break-all tw-font-mono tw-text-xs tw-text-iron-300">
                {change.path}
              </h4>
              <div className="tw-grid tw-gap-3 lg:tw-grid-cols-2">
                <ChangeValue
                  label={t(locale, "profileCms.agent.before")}
                  value={change.before}
                />
                <ChangeValue
                  label={t(locale, "profileCms.agent.after")}
                  value={change.after}
                />
              </div>
            </section>
          ))}
        </div>
      </details>
      <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "profileCms.agent.reviewHelp")}
      </p>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <StudioButton
          primary
          disabled={disabled || review.changes.length === 0}
          onClick={onAccept}
        >
          {acceptLabel}
        </StudioButton>
        <StudioButton disabled={disabled} onClick={onDismiss}>
          {t(locale, "profileCms.agent.closeReview")}
        </StudioButton>
      </div>
    </section>
  );
}

function ChangeValue({
  label,
  value,
}: {
  readonly label: string;
  readonly value: unknown;
}) {
  return (
    <div className="tw-min-w-0">
      <p className="tw-mb-1 tw-text-xs tw-font-medium tw-text-iron-400">
        {label}
      </p>
      <pre className="tw-mb-0 tw-max-h-80 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-black tw-p-3 tw-text-xs tw-text-iron-200">
        {value === undefined ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
