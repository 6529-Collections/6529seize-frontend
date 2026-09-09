import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { PublicReviewMarkdown } from "./PublicReviewMarkdown";

export type StreamReviewDiagramKind =
  | "formats"
  | "artist"
  | "roles"
  | "code"
  | "payment"
  | "finality";
type DiagramMessage = Extract<MessageKey, `publicReview.diagram.${string}`>;
type Point = { readonly title: string; readonly detail: string };

function PointText({ title, detail }: Point) {
  return (
    <>
      <span className="tw-block tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
        {title}
      </span>
      <span className="tw-mt-1 tw-block tw-text-sm tw-leading-6 tw-text-iron-300">
        {detail}
      </span>
    </>
  );
}

function Sequence({
  points,
  label,
}: {
  readonly points: readonly Point[];
  readonly label: string;
}) {
  return (
    <ol
      aria-label={label}
      className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-8 tw-p-0 @[34rem]:tw-flex-row"
    >
      {points.map((point, index) => (
        <li
          key={point.title}
          className="tw-relative tw-min-w-0 tw-flex-1 tw-border-0 tw-border-t tw-border-solid tw-border-iron-600 tw-pt-3"
        >
          <PointText {...point} />
          {index < points.length - 1 ? (
            <span
              aria-hidden="true"
              className="tw-absolute -tw-bottom-7 tw-left-0 tw-rotate-90 tw-text-xl tw-leading-6 tw-text-iron-400 @[34rem]:-tw-right-6 @[34rem]:tw-bottom-auto @[34rem]:tw-left-auto @[34rem]:tw-top-3 @[34rem]:tw-rotate-0"
            >
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function SeparateNote({
  title,
  children,
}: {
  readonly title: string;
  readonly children: string;
}) {
  return (
    <div className="tw-mt-6 tw-border-0 tw-border-l tw-border-dashed tw-border-iron-500 tw-pl-4">
      <PointText title={title} detail={children} />
    </div>
  );
}

function ArtMarks({
  kind,
}: {
  readonly kind: "unique" | "series" | "edition";
}) {
  const marks = kind === "unique" ? [0] : [0, 1, 2];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 144 52"
      className="tw-mb-4 tw-h-14 tw-w-36 tw-max-w-full tw-text-iron-300"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {marks.map((mark) => (
        <g key={mark} transform={`translate(${mark * 48 + 1} 4)`}>
          <rect width="38" height="42" rx="2" className="tw-text-iron-600" />
          {kind !== "series" || mark === 0 ? (
            <circle cx="19" cy="21" r="9" />
          ) : null}
          {kind === "series" && mark === 1 ? (
            <path d="M19 10 30 31H8Z" />
          ) : null}
          {kind === "series" && mark === 2 ? (
            <path d="m19 9 12 12-12 12L7 21Z" />
          ) : null}
        </g>
      ))}
    </svg>
  );
}

export function StreamReviewDiagram({
  kind,
  detailsMarkdown,
  locale = DEFAULT_LOCALE,
}: {
  readonly kind: StreamReviewDiagramKind;
  readonly detailsMarkdown?: string | undefined;
  readonly locale?: SupportedLocale;
}) {
  const message = (key: DiagramMessage) => t(locale, key);
  const point = (
    key:
      | "formats.unique"
      | "formats.series"
      | "formats.edition"
      | "artist.attribution"
      | "artist.mint"
      | "artist.payment"
      | "artist.finality"
      | "code.policy"
      | "code.ledger"
      | "code.core"
      | "code.drops"
      | "code.minter"
      | "code.helper"
      | "payment.pay"
      | "payment.credit"
      | "payment.withdraw"
      | "finality.close"
      | "finality.burn"
      | "finality.freeze"
  ): Point => ({
    title: message(`publicReview.diagram.${key}.title`),
    detail: message(`publicReview.diagram.${key}.detail`),
  });
  const caption = message(`publicReview.diagram.${kind}.caption`);
  const captionId = `stream-diagram-${kind}`;

  return (
    <figure
      aria-labelledby={captionId}
      className="tw-m-0 tw-my-7 tw-min-w-0 tw-break-words tw-@container"
    >
      <figcaption
        id={captionId}
        className="tw-mb-5 tw-text-xs tw-font-medium tw-leading-5 tw-tracking-wide tw-text-iron-400"
      >
        {caption}
      </figcaption>

      {kind === "formats" ? (
        <ul className="tw-m-0 tw-grid tw-list-none tw-gap-7 tw-p-0 @[34rem]:tw-grid-cols-3">
          {(["unique", "series", "edition"] as const).map((format) => (
            <li key={format} className="tw-min-w-0">
              <ArtMarks kind={format} />
              <PointText {...point(`formats.${format}`)} />
            </li>
          ))}
        </ul>
      ) : null}

      {kind === "artist" ? (
        <>
          <p className="tw-m-0 tw-border-0 tw-border-b tw-border-solid tw-border-iron-600 tw-pb-4 tw-text-base tw-font-medium tw-text-iron-100">
            {message("publicReview.diagram.artist.hub")}
          </p>
          <ul className="tw-m-0 tw-grid tw-list-none tw-gap-x-8 tw-gap-y-5 tw-p-0 @[30rem]:tw-grid-cols-2">
            {(["attribution", "mint", "payment", "finality"] as const).map(
              (decision) => (
                <li
                  key={decision}
                  className="tw-min-w-0 tw-border-0 tw-border-l tw-border-solid tw-border-iron-600 tw-pl-4 tw-pt-4"
                >
                  <PointText {...point(`artist.${decision}`)} />
                </li>
              )
            )}
          </ul>
          <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-300">
            {message("publicReview.diagram.artist.note")}
          </p>
        </>
      ) : null}

      {kind === "roles" ? (
        <dl className="tw-m-0">
          {(
            [
              "artist",
              "collector",
              "manager",
              "governance",
              "pause",
              "guardian",
              "poster",
            ] as const
          ).map((role) => (
            <div
              key={role}
              className="tw-grid tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-4 @[30rem]:tw-grid-cols-[10rem_minmax(0,1fr)] @[30rem]:tw-gap-5"
            >
              <dt className="tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
                {message(`publicReview.diagram.roles.${role}.title`)}
                <span className="tw-mt-0.5 tw-block tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
                  {message(
                    role === "artist" || role === "poster"
                      ? `publicReview.diagram.roles.${role}.status`
                      : "publicReview.diagram.built"
                  )}
                </span>
              </dt>
              <dd className="tw-m-0 tw-flex tw-gap-5 tw-text-sm tw-leading-6 tw-text-iron-300">
                <span
                  aria-hidden="true"
                  className="tw-hidden tw-text-iron-400 @[30rem]:tw-block"
                >
                  →
                </span>
                <span>
                  {message(`publicReview.diagram.roles.${role}.detail`)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {kind === "code" ? (
        <>
          <p className="tw-mb-3 tw-mt-0 tw-text-sm tw-font-medium tw-text-iron-200">
            {message("publicReview.diagram.code.permanent")}
          </p>
          <Sequence
            label={message("publicReview.diagram.code.permanent")}
            points={[
              point("code.policy"),
              point("code.ledger"),
              point("code.core"),
            ]}
          />
          <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-300">
            {message("publicReview.diagram.code.orderNote")}
          </p>
          <p className="tw-mb-3 tw-mt-8 tw-text-sm tw-font-medium tw-text-iron-200">
            {message("publicReview.diagram.code.legacy")}
          </p>
          <Sequence
            label={message("publicReview.diagram.code.legacy")}
            points={[
              point("code.drops"),
              point("code.minter"),
              point("code.helper"),
            ]}
          />
          <SeparateNote title={message("publicReview.diagram.code.unfinished")}>
            {message("publicReview.diagram.code.unfinishedDetail")}
          </SeparateNote>
          <SeparateNote title={message("publicReview.diagram.code.proposed")}>
            {message("publicReview.diagram.code.proposedDetail")}
          </SeparateNote>
        </>
      ) : null}

      {kind === "payment" ? (
        <>
          <Sequence
            label={caption}
            points={[
              point("payment.pay"),
              point("payment.credit"),
              point("payment.withdraw"),
            ]}
          />
          <SeparateNote
            title={message("publicReview.diagram.payment.separate")}
          >
            {message("publicReview.diagram.payment.separateDetail")}
          </SeparateNote>
        </>
      ) : null}

      {kind === "finality" ? (
        <>
          <Sequence
            label={caption}
            points={[
              point("finality.close"),
              point("finality.burn"),
              point("finality.freeze"),
            ]}
          />
          <SeparateNote title={message("publicReview.diagram.finality.wider")}>
            {message("publicReview.diagram.finality.widerDetail")}
          </SeparateNote>
          <SeparateNote
            title={message("publicReview.diagram.finality.preserve")}
          >
            {message("publicReview.diagram.finality.preserveDetail")}
          </SeparateNote>
        </>
      ) : null}

      {detailsMarkdown && (kind === "roles" || kind === "code") ? (
        <details className="tw-mt-4">
          <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-text-sm tw-text-iron-300 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
            {message(`publicReview.diagram.${kind}.details`)}
          </summary>
          <PublicReviewMarkdown
            compactTables
            markdown={detailsMarkdown}
            internalLinkBasePath="/reviews/6529-stream"
          />
        </details>
      ) : null}
    </figure>
  );
}
