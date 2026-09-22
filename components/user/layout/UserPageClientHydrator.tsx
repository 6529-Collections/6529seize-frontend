"use client";

import { useEffect, useContext } from "react";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSetTitle } from "@/contexts/TitleContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly pageTitle: string;
};

export default function UserPageClientHydrator({
  profile,
  handleOrWallet,
  pageTitle,
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

  useSetTitle(pageTitle);

  return null;
}
