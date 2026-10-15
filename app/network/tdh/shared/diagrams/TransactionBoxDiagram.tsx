import { useId } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/**
 * Step 5 and DEV-2: one transaction that sends a copy out of Wallet A to
 * Wallet C and back. Two arcs join the wallets, each labelled with its
 * movement, and the result, netted at the transaction boundary (D131), sits
 * inside the figure: Wallet A never lost the copy.
 */
export default function TransactionBoxDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const arrow = `${id}-arrow`;
  const titleId = `${id}-title`;
  return (
    <figure className="tw-m-0 tw-max-w-md">
      <svg
        viewBox="0 0 340 204"
        role="img"
        aria-labelledby={titleId}
        className="tw-block tw-h-auto tw-w-full"
      >
        <title id={titleId}>
          {t(locale, "network.tdh.how.s5.diagramDesc")}
        </title>
        <defs>
          <marker
            id={arrow}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="tw-fill-primary-300" />
          </marker>
        </defs>
        <rect
          x="6"
          y="6"
          width="328"
          height="150"
          rx="14"
          fill="none"
          strokeDasharray="5 5"
          className="tw-stroke-iron-600"
        />
        <text x="22" y="28" fontSize="12" className="tw-fill-iron-300">
          {t(locale, "network.tdh.how.s5.transaction")}
        </text>
        <path
          d="M 84 76 Q 170 22 256 76"
          fill="none"
          strokeWidth="2"
          markerEnd={`url(#${arrow})`}
          className="tw-stroke-primary-300"
        />
        <path
          d="M 256 100 Q 170 154 84 100"
          fill="none"
          strokeWidth="2"
          markerEnd={`url(#${arrow})`}
          className="tw-stroke-primary-300"
        />
        <text
          x="170"
          y="38"
          textAnchor="middle"
          fontSize="13"
          className="tw-fill-primary-300 tw-font-medium"
        >
          {t(locale, "network.tdh.how.s5.out")}
        </text>
        <text
          x="170"
          y="147"
          textAnchor="middle"
          fontSize="13"
          className="tw-fill-primary-300 tw-font-medium"
        >
          {t(locale, "network.tdh.how.s5.back")}
        </text>
        {[
          { x: 60, label: "A" },
          { x: 280, label: "C" },
        ].map((wallet) => (
          <g key={wallet.label}>
            <circle
              cx={wallet.x}
              cy="88"
              r="22"
              strokeWidth="1.5"
              className="tw-fill-iron-800 tw-stroke-iron-500"
            />
            <text
              x={wallet.x}
              y="93"
              textAnchor="middle"
              fontSize="16"
              className="tw-fill-iron-50 tw-font-semibold"
            >
              {wallet.label}
            </text>
          </g>
        ))}
        <rect
          x="70"
          y="168"
          width="200"
          height="30"
          rx="15"
          strokeWidth="1.5"
          className="tw-fill-iron-900 tw-stroke-success"
        />
        <text
          x="170"
          y="188"
          textAnchor="middle"
          fontSize="13"
          className="tw-fill-iron-50 tw-font-medium"
        >
          {t(locale, "network.tdh.how.s5.net")}
        </text>
      </svg>
    </figure>
  );
}
