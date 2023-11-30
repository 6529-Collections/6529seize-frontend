import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import SocialStatementIcon from "../../../utils/icons/SocialStatementIcon";
import { commonApiDelete } from "../../../../../services/api/common-api";
import { useContext } from "react";
import { AuthContext } from "../../../../auth/Auth";

export default function UserPageIdentityStatementsStatement({
  statement,
  profile,
}: {
  statement: CicStatement;
  profile: IProfileAndConsolidations;
}) {
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useContext(AuthContext);

  const deleteStatementMutation = useMutation({
    mutationFn: async () =>
      await commonApiDelete({
        endpoint: `profiles/${profile.profile?.handle}/cic/statements/${statement.id}`,
      }),
    onSuccess: () => {
      setToast({
        message: "CIC statement deleted.",
        type: "warning",
      });
      queryClient.invalidateQueries({
        queryKey: ["user-cic-statements", profile.profile?.handle],
      });
      for (const wallet of profile.consolidation.wallets) {
        queryClient.invalidateQueries({
          queryKey: [
            "user-cic-statements",
            wallet.wallet.address.toLowerCase(),
          ],
        });

        if (wallet.wallet.ens) {
          queryClient.invalidateQueries({
            queryKey: ["user-cic-statements", wallet.wallet.ens.toLowerCase()],
          });
        }
      }
    },
  });

  const onDelete = async () => {
    const { success } = await requestAuth();
    if (!success) return;
    await deleteStatementMutation.mutateAsync();
  };

  return (
    <li
      onClick={onDelete}
      className="tw-group tw-cursor-pointer tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out tw-space-x-3"
    >
      <div className="tw-cursor-pointer tw-w-6 tw-h-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
        <SocialStatementIcon statementType={statement.statement_type} />
      </div>
      <div className="tw-flex tw-items-center">
        <span>{statement.statement_value}</span>
      </div>
    </li>
  );
}
