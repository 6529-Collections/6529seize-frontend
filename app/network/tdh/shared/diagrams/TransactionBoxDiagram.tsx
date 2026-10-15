import { useId } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/**
 * Step 5 and DEV-2: one transaction that sends a copy out of Wallet A and
 * back. Netted at the transaction boundary (D131), Wallet A never lost it.
 */
export default function TransactionBoxDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  return (
    <svg
      viewBox="0 0 480 200"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className="tw-block tw-h-auto tw-w-full tw-max-w-xl"
    >
      <title id={titleId}>{t(locale, "network.tdh.how.s5.diagramTitle")}</title>
      <desc id={descId}>{t(locale, "network.tdh.how.s5.diagramDesc")}</desc>
      <defs>
        <marker
          id={`${id}-arrow`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" className="tw-fill-primary-300" />
        </marker>
      </defs>
      <rect
        x="20"
        y="14"
        width="440"
        height="120"
        rx="14"
        className="tw-fill-iron-900 tw-stroke-iron-600"
        strokeDasharray="5 5"
        strokeWidth="1.5"
      />
      <text
        x="36"
        y="38"
        className="tw-fill-iron-400 tw-text-[12px] tw-font-medium"
      >
        {t(locale, "network.tdh.how.s5.transaction")}
      </text>
      {[
        { x: 70, label: "A" },
        { x: 410, label: "C" },
      ].map((wallet) => (
        <g key={wallet.label}>
          <circle
            cx={wallet.x}
            cy="84"
            r="24"
            className="tw-fill-iron-800 tw-stroke-iron-500"
            strokeWidth="1.5"
          />
          <text
            x={wallet.x}
            y="89"
            textAnchor="middle"
            className="tw-fill-iron-50 tw-text-[15px] tw-font-semibold"
          >
            {wallet.label}
          </text>
        </g>
      ))}
      <path
        d="M98 74 C 180 50, 300 50, 382 74"
        fill="none"
        strokeWidth="2"
        className="tw-stroke-primary-300"
        markerEnd={`url(#${id}-arrow)`}
      />
      <text
        x="240"
        y="52"
        textAnchor="middle"
        className="tw-fill-iron-300 tw-text-[12px]"
      >
        {t(locale, "network.tdh.how.s5.out")}
      </text>
      <path
        d="M382 96 C 300 120, 180 120, 98 96"
        fill="none"
        strokeWidth="2"
        className="tw-stroke-primary-300"
        markerEnd={`url(#${id}-arrow)`}
      />
      <text
        x="240"
        y="126"
        textAnchor="middle"
        className="tw-fill-iron-300 tw-text-[12px]"
      >
        {t(locale, "network.tdh.how.s5.back")}
      </text>
      <rect
        x="120"
        y="152"
        width="240"
        height="36"
        rx="18"
        className="tw-fill-iron-800 tw-stroke-success"
        strokeWidth="1.5"
      />
      <text
        x="240"
        y="175"
        textAnchor="middle"
        className="tw-fill-iron-50 tw-text-[13px] tw-font-medium"
      >
        {t(locale, "network.tdh.how.s5.net")}
      </text>
    </svg>
  );
}
