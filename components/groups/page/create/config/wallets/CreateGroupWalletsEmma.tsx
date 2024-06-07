import { useContext, useEffect, useState } from "react";
import EmmaListSearch from "../../../../../utils/input/emma/EmmaListSearch";
import {
  AllowlistDescription,
  AllowlistResult,
} from "../../../../../allowlist-tool/allowlist-tool.types";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { distributionPlanApiFetch } from "../../../../../../services/distribution-plan-api";
import { AuthContext } from "../../../../../auth/Auth";
import GroupCreateWalletsCount from "./GroupCreateWalletsCount";

export default function CreateGroupWalletsEmma({
  wallets,
  setWallets,
}: {
  readonly wallets: string[] | null;
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  const { requestAuth, connectedProfile } = useContext(AuthContext);
  const [selected, setSelected] = useState<AllowlistDescription | null>(null);
  const { data: emmaList } = useQuery<AllowlistResult[]>({
    queryKey: [QueryKey.EMMA_ALLOWLIST_RESULT, { allowlistId: selected?.id }],
    queryFn: async () => {
      await requestAuth();
      const { success } = await requestAuth();
      if (!success) {
        return [];
      }
      const endpoint = `/allowlists/${selected?.id}/results`;
      const { data } = await distributionPlanApiFetch<AllowlistResult[]>(
        endpoint
      );
      return data ?? [];
    },
    enabled: !!connectedProfile?.profile?.handle && !!selected,
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
    <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        EMMA
      </p>
      <div className="tw-mt-4">
        <EmmaListSearch
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
      </div>

      <GroupCreateWalletsCount
        walletsCount={wallets?.length ?? null}
        removeWallets={onWalletsRemove}
      />
    </div>
  );
}
