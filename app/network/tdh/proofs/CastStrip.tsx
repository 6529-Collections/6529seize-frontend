import { fill } from "@/components/explained/i18n";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { k } from "./_lib/copy";

/**
 * Who is who, right under the verdict that names them (a reader holds
 * seven names on this page): the two programs and their proofs, and the
 * daily check's Python reference, which is never proved. One row of three
 * short entries between hairlines, not three more cards.
 */
const CAST = [
  { id: "a", name: "cast.a", body: "cast.aBody" },
  { id: "b", name: "cast.b", body: "cast.bBody" },
  { id: "python", name: "cast.python", body: "cast.pythonBody" },
] as const;

export default function CastStrip({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      className="tw-mt-6 tw-border-0 tw-border-y tw-border-solid tw-border-iron-900 tw-py-4"
      aria-label={fill(locale, k("cast.label"))}
      data-cast=""
    >
      <span className={`${EX_TEXT.label} tw-block`}>
        {fill(locale, k("cast.label"))}
      </span>
      <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 md:tw-grid-cols-3 md:tw-gap-6">
        {CAST.map((entry) => (
          <li
            key={entry.id}
            className="md:tw-border-0 md:tw-border-l md:tw-border-solid md:tw-border-iron-900 md:tw-pl-5 md:first:tw-border-l-0 md:first:tw-pl-0"
            data-cast-entry={entry.id}
          >
            <b
              className={`${EX_TEXT.small} tw-block tw-font-semibold tw-text-iron-50`}
            >
              {fill(locale, k(entry.name))}
            </b>
            <p className={`${EX_TEXT.claim} tw-m-0`}>
              {fill(locale, k(entry.body))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
