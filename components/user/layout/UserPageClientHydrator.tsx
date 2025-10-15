"use client";

import { useEffect, useMemo, useContext } from "react";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSetTitle } from "@/contexts/TitleContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { containsEmojis, formatAddress } from "@/helpers/Helpers";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
};

export default function UserPageClientHydrator({
  profile,
  handleOrWallet,
}: Readonly<Props>) {
  const normalizedHandleOrWallet = handleOrWallet.toLowerCase();
  const queryClient = useQueryClient();
  const { setProfile } = useContext(ReactQueryWrapperContext);

  useEffect(() => {
    queryClient.setQueryData<ApiIdentity>(
      [QueryKey.PROFILE, normalizedHandleOrWallet],
      profile
    );
    setProfile(profile);
  }, [profile, normalizedHandleOrWallet, queryClient, setProfile]);

  const pageTitle = useMemo(() => {
    if (profile?.handle) {
      return `${profile.handle} | 6529.io`;
    }

    if (profile?.display && !containsEmojis(profile.display)) {
      return `${profile.display} | 6529.io`;
    }

    return `${formatAddress(normalizedHandleOrWallet)} | 6529.io`;
  }, [profile, normalizedHandleOrWallet]);

  useSetTitle(pageTitle);

  return null;
}
