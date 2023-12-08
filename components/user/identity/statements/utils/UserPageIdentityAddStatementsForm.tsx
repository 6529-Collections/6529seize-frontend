import { useContext, useState } from "react";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "../../../../../helpers/Types";
import UserPageIdentityAddStatementsInput from "./UserPageIdentityAddStatementsInput";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../services/api/common-api";
import { AuthContext } from "../../../../auth/Auth";

type ApiCreateOrUpdateProfileCicStatement = Omit<
  CicStatement,
  "id" | "crated_at" | "updated_at" | "profile_id"
>;

export default function UserPageIdentityAddStatementsForm({
  profile,
  activeType,
  group,
  onClose,
}: {
  profile: IProfileAndConsolidations;
  activeType: STATEMENT_TYPE;
  group: STATEMENT_GROUP;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useContext(AuthContext);
  const [value, setValue] = useState<string>("");

  const addStatementMutation = useMutation({
    mutationFn: async (statement: string) =>
      await commonApiPost<ApiCreateOrUpdateProfileCicStatement, CicStatement>({
        endpoint: `profiles/${profile.profile?.handle}/cic/statements`,
        body: {
          statement_group: group,
          statement_type: activeType,
          statement_comment: null,
          statement_value: statement,
        },
      }),
    onSuccess: () => {
      setToast({
        message: "CIC statement added.",
        type: "success",
      });
      queryClient.invalidateQueries({
        queryKey: [
          "user-cic-statements",
          profile.profile?.handle.toLowerCase(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "profile-logs",
          {
            profile: profile.profile?.handle.toLowerCase(),
          },
        ],
      });
      for (const wallet of profile.consolidation.wallets) {
        queryClient.invalidateQueries({
          queryKey: [
            "user-cic-statements",
            wallet.wallet.address.toLowerCase(),
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "profile-logs",
            {
              profile: wallet.wallet.address.toLowerCase(),
            },
          ],
        });

        if (wallet.wallet.ens) {
          queryClient.invalidateQueries({
            queryKey: ["user-cic-statements", wallet.wallet.ens.toLowerCase()],
          });
          queryClient.invalidateQueries({
            queryKey: [
              "profile-logs",
              {
                profile: wallet.wallet.ens.toLowerCase(),
              },
            ],
          });
        }
      }
    },
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value) return;
    const { success } = await requestAuth();
    if (!success) return;
    await addStatementMutation.mutateAsync(value);
    setValue("");
    onClose();
  };
  return (
    <div className="tw-mt-4">
      <form onSubmit={onSubmit}>
        <UserPageIdentityAddStatementsInput
          activeType={activeType}
          value={value}
          onChange={setValue}
        />

        <div className="tw-mt-8">
          <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-3">
            <button
              onClick={onClose}
              type="button"
              className="tw-cursor-pointer tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-iron-600 tw-rounded-lg hover:tw-bg-iron-800 hover:tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
