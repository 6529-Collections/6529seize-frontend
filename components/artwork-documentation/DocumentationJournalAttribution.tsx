"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatDate } from "@/i18n/format";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { useDocumentationActor } from "./DocumentationAuthGate";
import { useDocumentationMessages } from "./DocumentationControls";

function matchingHandle(
  profile: Pick<ApiIdentity, "id" | "handle"> | null | undefined,
  id: string
): string | null {
  if (profile?.id !== id) return null;
  const handle = profile.handle?.trim();
  if (handle === undefined || handle.length === 0) return null;
  return handle;
}

export default function DocumentationJournalAttribution({
  profileId,
  createdAt,
  active,
}: {
  readonly profileId: string;
  readonly createdAt: number;
  readonly active: boolean;
}) {
  const { msg, locale } = useDocumentationMessages();
  const { connectedProfile } = useDocumentationActor();
  const knownHandle = matchingHandle(connectedProfile, profileId);
  const identity = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: profileId }),
    enabled:
      active &&
      !knownHandle &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        profileId
      ),
    retry: false,
  });
  const fetchedHandle = matchingHandle(identity.data, profileId);
  return msg("museum.journalAttribution", {
    actor: knownHandle ?? fetchedHandle ?? msg("museum.journalContributor"),
    date: formatDate(locale, createdAt),
  });
}
