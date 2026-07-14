"use client";

import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchMentionAliases } from "@/services/api/mention-aliases-api";
import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";

export function useMentionAliases() {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const ownerProfileId = connectedProfile?.id ?? null;
  const enabled = !!ownerProfileId && !activeProfileProxy;
  const query = useQuery({
    queryKey: [QueryKey.MENTION_ALIASES, ownerProfileId],
    queryFn: fetchMentionAliases,
    enabled,
    staleTime: 60_000,
  });

  return {
    ...query,
    aliases: enabled ? (query.data ?? []) : [],
  };
}
