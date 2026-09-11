import ButtonLink from "@/components/utils/button/ButtonLink";
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
    <ButtonLink
      href={getCollectHref({ collection, intent, tokenId, definitionId })}
      variant="secondary"
      size="sm"
      className="tw-min-h-11"
    >
      {t(locale, complete ? "collect.entry.complete" : "collect.entry.collect")}
    </ButtonLink>
  );
}
