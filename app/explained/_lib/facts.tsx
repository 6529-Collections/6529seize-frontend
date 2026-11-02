import FactValue from "@/components/explained/facts/FactValue";
import type { SupportedLocale } from "@/i18n/locales";
import type {
  FactBook,
  FactEntry,
  FactId,
  FactStyle,
} from "@/lib/explained/facts";

/**
 * A fact from the page's book for printing: the fact, or its unavailable
 * entry (so the printed "not available" still names its id), never a
 * number typed by hand.
 */
function factEntry(book: FactBook, id: FactId): FactEntry | null {
  return book.maybe(id) ?? book.snapshot().facts[id] ?? null;
}

/** Prints one fact of the page's book (server components). */
export function Fact({
  book,
  id,
  locale,
  style,
  className,
}: {
  readonly book: FactBook;
  readonly id: FactId;
  readonly locale: SupportedLocale;
  readonly style?: FactStyle;
  readonly className?: string;
}) {
  return (
    <FactValue
      fact={factEntry(book, id)}
      locale={locale}
      {...(style === undefined ? {} : { style })}
      {...(className === undefined ? {} : { className })}
    />
  );
}
