import { AddressChip } from "@/components/stream/ui/AddressChip";
import type { AddressLabeler } from "@/components/stream/work/useAddressLabels";
import type { SupportedLocale } from "@/i18n/locales";
import type { Address } from "@/lib/stream/types";

/** An address with its known name ("You", an artist, the museum), or shortened. */
export default function KnownAddress({
  address,
  label,
  locale,
}: {
  readonly address: Address;
  readonly label: AddressLabeler;
  readonly locale: SupportedLocale;
}) {
  const name = label(address);
  return name === undefined ? (
    <AddressChip address={address} locale={locale} />
  ) : (
    <AddressChip address={address} label={name} locale={locale} />
  );
}
