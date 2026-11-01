import type { useStreamAction } from "@/components/stream/pages/common";
import type { AddressLabeler } from "@/components/stream/work/useAddressLabels";
import type { SupportedLocale } from "@/i18n/locales";
import type {
  Address,
  EditionAuction,
  OneOfOneAuction,
  StreamWork,
} from "@/lib/stream/types";

/** What every part of the 1/1 auction panel reads. */
export interface EnglishPanelContext {
  readonly auction: OneOfOneAuction;
  /** The auctioned work, once loaded. */
  readonly work: StreamWork | null;
  /** The linked edition auction that closes after this one, if any. */
  readonly editions: EditionAuction | null;
  readonly locale: SupportedLocale;
  readonly now: number;
  readonly label: AddressLabeler;
  readonly action: ReturnType<typeof useStreamAction>;
}

export function sameAddress(
  left: Address | null | undefined,
  right: Address | null | undefined
): boolean {
  if (!left || !right) {
    return false;
  }
  return left.toLowerCase() === right.toLowerCase();
}

/** The work's contract is delisted from the federation registry. */
export function isDelisted(context: EnglishPanelContext): boolean {
  return context.work?.federated?.status === "DELISTED";
}
