import { fill } from "@/components/explained/i18n";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { k } from "./_lib/copy";

/**
 * Who is who, before the sections (a reader holds seven names on this
 * page): the two programs and their proofs, and the daily check's Python
 * reference, which is never proved. Three cards, one line each.
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
      className="tw-mt-12 md:tw-mt-16"
      aria-label={fill(locale, k("cast.label"))}
      data-cast=""
    >
      <span className={`${EX_TEXT.label} tw-block`}>
        {fill(locale, k("cast.label"))}
      </span>
      <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 md:tw-grid-cols-3 md:tw-gap-4">
        {CAST.map((entry) => (
          <li
            key={entry.id}
            className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-py-4"
            data-cast-entry={entry.id}
          >
            <b className="tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
              {fill(locale, k(entry.name))}
            </b>
            <p className="tw-m-0 tw-mt-1 tw-text-[15px] tw-leading-6 tw-text-iron-300">
              {fill(locale, k(entry.body))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
