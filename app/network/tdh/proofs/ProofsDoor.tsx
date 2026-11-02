import Link from "next/link";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import { fill } from "@/components/explained/i18n";
import { EX_FOCUS, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { k, PROOFS_ROUTE } from "./_lib/copy";

/**
 * The door to "Zero-knowledge proofs" from the pages that link it (How sure,
 * the overview's How we know, the daily check): one card with the half
 * pair and a sentence written for the page it sits on. Its copy is this
 * page's (`explained.tdh.proofs.door.*`), so the pages that place it add
 * no strings of their own.
 */
type ProofsDoorFrom = "sure" | "check" | "overview";

const LINE = {
  sure: "door.sure",
  check: "door.check",
  overview: "door.overview",
} as const;

export default function ProofsDoor({
  from,
  locale,
}: {
  readonly from: ProofsDoorFrom;
  readonly locale: SupportedLocale;
}) {
  return (
    <Link
      href={PROOFS_ROUTE}
      className={`tw-group tw-grid tw-grid-cols-1 tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-[18px] tw-no-underline hover:tw-border-iron-700 md:tw-grid-cols-[auto_minmax(0,1fr)] md:tw-items-center md:tw-gap-5 ${EX_FOCUS}`}
      data-proofs-door={from}
    >
      <HalfPair a b={false} locale={locale} />
      <span>
        <span className={`${EX_TEXT.label} tw-block`}>
          {fill(locale, k("door.kicker"))}
        </span>
        <span className="tw-mt-1 tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 group-hover:tw-text-primary-300">
          {fill(locale, k(LINE[from]))}
        </span>
      </span>
    </Link>
  );
}
