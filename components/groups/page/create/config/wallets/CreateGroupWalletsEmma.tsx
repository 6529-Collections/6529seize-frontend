"use client";

import { GROUP_CREATE_PANEL_STYLES } from "../../GroupCreate.styles";
import { useContext, useEffect, useState } from "react";
import EmmaListSearch from "@/components/utils/input/emma/EmmaListSearch";
import type {
  AllowlistDescription,
  AllowlistResult,
} from "@/components/allowlist-tool/allowlist-tool.types";
import { useQuery } from "@tanstack/react-query";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { AuthContext } from "@/components/auth/Auth";
import GroupCreateWalletsCount from "./GroupCreateWalletsCount";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export default function CreateGroupWalletsEmma({
  wallets,
  setWallets,
}: {
  readonly wallets: string[] | null;
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  const { requestAuth, connectedProfile } = useContext(AuthContext);
  const [selected, setSelected] = useState<AllowlistDescription | null>(null);
  const { data: emmaList, isFetching } = useQuery<AllowlistResult[]>({
    queryKey: [QueryKey.EMMA_ALLOWLIST_RESULT, { allowlistId: selected?.id }],
    queryFn: async () => {
      await requestAuth();
      const { success } = await requestAuth();
      if (!success) {
        return [];
      }
      const endpoint = `/allowlists/${selected?.id}/results`;
      const { data } =
        await distributionPlanApiFetch<AllowlistResult[]>(endpoint);
      return data ?? [];
    },
    enabled: !!connectedProfile?.handle && !!selected,
  });

  useEffect(
    () =>
      setWallets(emmaList?.map((item) => item.wallet.toLowerCase()) ?? null),
    [emmaList]
  );

  const onWalletsRemove = () => {
    setWallets(null);
    setSelected(null);
  };

  return (
    <div className={GROUP_CREATE_PANEL_STYLES}>
      <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50 sm:tw-text-lg">
        EMMA
      </p>
      <div className="tw-mb-3 tw-mt-2 sm:tw-mt-3">
        <EmmaListSearch
          selectedId={selected?.id ?? null}
          selectedName={selected?.name ?? null}
          onSelect={setSelected}
        />
      </div>

      <GroupCreateWalletsCount
        walletsCount={wallets?.length ?? null}
        loading={isFetching}
        removeWallets={onWalletsRemove}
      />
    </div>
  );
}
