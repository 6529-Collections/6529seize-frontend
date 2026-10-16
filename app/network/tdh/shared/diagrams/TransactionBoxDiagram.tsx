import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { NARROW_WIDTH, TdhSvg } from "../TdhSvg";

/**
 * Step 5 and DEV-2: one transaction that sends a copy out of Wallet A to
 * Wallet C and back. Two arcs join the wallets, each labelled with its
 * movement, and the result, netted at the transaction boundary (D131), sits
 * inside the frame under the arcs: Wallet A never lost the copy. One compact drawing, phone
 * first: its text is 14 units, so it stays above 12 px in any column it is
 * shown in, and it is never drawn larger than its own size, so its labels
 * stay quieter than the card around it.
 */
export default function TransactionBoxDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const arrow = "tdh-transaction-arrow";
  return (
    <figure className="tw-m-0 tw-flex tw-justify-center">
      <TdhSvg
        id="tdh-transaction"
        width={NARROW_WIDTH}
        maxWidth={NARROW_WIDTH}
        height={200}
        title={t(locale, "network.tdh.how.s5.diagramTitle")}
        desc={t(locale, "network.tdh.how.s5.diagramDesc")}
      >
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
          x="2"
          y="2"
          width={NARROW_WIDTH - 4}
          height="196"
          rx="14"
          fill="none"
          strokeDasharray="5 5"
          className="tw-stroke-iron-500"
        />
        {/* The frame's label, quieter than the card's own eyebrow: grey,
            in sentence case, at the drawing's smallest size. */}
        <text x="16" y="26" fontSize="14" className="tw-fill-iron-400">
          {t(locale, "network.tdh.how.s5.transaction")}
        </text>
        <path
          d="M 80 72 Q 140 30 200 72"
          fill="none"
          strokeWidth="2"
          markerEnd={`url(#${arrow})`}
          className="tw-stroke-primary-300"
        />
        <path
          d="M 200 96 Q 140 138 80 96"
          fill="none"
          strokeWidth="2"
          markerEnd={`url(#${arrow})`}
          className="tw-stroke-primary-300"
        />
        <text
          x="140"
          y="46"
          textAnchor="middle"
          fontSize="14"
          className="tw-fill-primary-300 tw-font-medium"
        >
          {t(locale, "network.tdh.how.s5.out")}
        </text>
        <text
          x="140"
          y="134"
          textAnchor="middle"
          fontSize="14"
          className="tw-fill-primary-300 tw-font-medium"
        >
          {t(locale, "network.tdh.how.s5.back")}
        </text>
        {[
          { x: 56, label: "A" },
          { x: 224, label: "C" },
        ].map((wallet) => (
          <g key={wallet.label}>
            <circle
              cx={wallet.x}
              cy="84"
              r="22"
              strokeWidth="1.5"
              className="tw-fill-iron-800 tw-stroke-iron-500"
            />
            <text
              x={wallet.x}
              y="90"
              textAnchor="middle"
              fontSize="15"
              className="tw-fill-iron-50 tw-font-semibold"
            >
              {wallet.label}
            </text>
          </g>
        ))}
        <rect
          x="20"
          y="150"
          width="240"
          height="34"
          rx="17"
          strokeWidth="1.5"
          className="tw-fill-iron-900 tw-stroke-success"
        />
        <text
          x="140"
          y="172"
          textAnchor="middle"
          fontSize="14"
          className="tw-fill-iron-50 tw-font-medium"
        >
          {t(locale, "network.tdh.how.s5.net")}
        </text>
      </TdhSvg>
    </figure>
  );
}
