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
      /* hover:tw-bg-neutral-800 - kui kasutaja on oma profiili vaates ja hoverdab statemendil */
      className="hover:tw-bg-neutral-800 tw-group tw-cursor-pointer tw-inline-flex tw-py-1.5 tw-px-1.5 tw-rounded-lg tw-items-center tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-400 tw-transition tw-duration-300 tw-ease-out "
    >
      <div className="tw-inline-flex tw-items-center tw-space-x-3">
        <div className="tw-cursor-pointer tw-w-6 tw-h-6 group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
          <SocialStatementIcon statementType={statement.statement_type} />
        </div>
        <div className="tw-flex tw-items-center">
          <span>{statement.statement_value}</span>
        </div>
      </div>
      {/* Delete icon - kui kasutaja on oma profiili vaates ja hoverdab statemendil */}
      <svg
        className="tw-flex-shrink-0 tw-ml-4 tw-w-6 tw-h-6 tw-text-red tw-transition tw-duration-300 tw-ease-out hover:tw-scale-110"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </li>
  );
}
