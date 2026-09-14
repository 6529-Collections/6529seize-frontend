import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CollectCollection, CollectIntent } from "./collect.types";

export function getCollectHref({
  collection,
  intent,
  tokenId,
  definitionId,
}: {
  readonly collection?: CollectCollection | undefined;
  readonly intent?: CollectIntent | undefined;
  readonly tokenId?: string | undefined;
  readonly definitionId?: string | undefined;
}): string {
  const query = new URLSearchParams();
  if (collection && collection !== "all") query.set("collection", collection);
  if (intent && intent !== "explore") query.set("intent", intent);
  if (tokenId) query.set("token", tokenId);
  if (definitionId) query.set("definition", definitionId);
  const suffix = query.toString();
  return suffix ? `/collect?${suffix}` : "/collect";
}

export default function CollectEntryLink({
  collection,
  intent,
  tokenId,
  definitionId,
  locale = DEFAULT_LOCALE,
  complete = false,
}: {
  readonly collection?: CollectCollection | undefined;
  readonly intent?: CollectIntent | undefined;
  readonly tokenId?: string | undefined;
  readonly definitionId?: string | undefined;
  readonly locale?: SupportedLocale | undefined;
  readonly complete?: boolean | undefined;
}) {
  return (
    <Link
      href={getCollectHref({ collection, intent, tokenId, definitionId })}
      className="tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-px-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-white"
    >
      {t(locale, complete ? "collect.entry.complete" : "collect.entry.collect")}
      <ArrowRightIcon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
    </Link>
  );
}
