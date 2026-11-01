import Link from "next/link";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { Address } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

import { STREAM_FOCUS } from "@/components/stream/ui/styles";

/** Inline identity text with a generated mark: no pill, no background. */
const CHIP =
  "tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-center tw-gap-1.5 tw-text-sm tw-text-iron-200";

/** "0x1234…abcd". */
function shortAddress(address: string): string {
  return address.length > 12
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : address;
}

/** A stable hue from an address or ID, for the generated avatar dot. */
function hueOf(seed: string): number {
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }
  return hash;
}

function Avatar({ seed }: { readonly seed: string }) {
  const hue = hueOf(seed.toLowerCase());
  return (
    <span
      aria-hidden="true"
      className="tw-size-4 tw-flex-none tw-rounded"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 60) % 360} 70% 35%))`,
      }}
    />
  );
}

/** An address, shortened, with its full value in the accessible name. */
export function AddressChip({
  address,
  locale,
  label,
}: {
  readonly address: Address;
  readonly locale: SupportedLocale;
  /** A known name for the address (a dev account, the museum). */
  readonly label?: string;
}) {
  return (
    <span
      className={CHIP}
      title={address}
      aria-label={t(locale, "stream.address.label", {
        name: label ?? shortAddress(address),
        address,
      })}
    >
      <Avatar seed={address} />
      <span className="tw-truncate tw-font-mono tw-text-xs">
        {label ?? shortAddress(address)}
      </span>
    </span>
  );
}

/** An artist, linking to their page in the section. */
export function ArtistChip({
  artistId,
  name,
  locale,
}: {
  readonly artistId: string;
  readonly name: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <Link
      href={STREAM_ROUTES.artist(artistId)}
      className={`${CHIP} ${STREAM_FOCUS} tw-rounded-md tw-no-underline hover:tw-text-iron-50 hover:tw-underline`}
      aria-label={t(locale, "stream.artist.link", { name })}
    >
      <Avatar seed={artistId} />
      <span className="tw-truncate">{name}</span>
    </Link>
  );
}
