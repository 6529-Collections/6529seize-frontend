import { useContext, useEffect, useState } from "react";
import {
  STATEMENT_GROUP,
  STATEMENT_INPUT_INITIAL_VALUE,
  STATEMENT_TYPE,
} from "../../../../../helpers/Types";
import UserPageIdentityAddStatementsInput from "./UserPageIdentityAddStatementsInput";
import {
  CicStatement,
  IProfileAndConsolidations,
} from "../../../../../entities/IProfile";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../services/api/common-api";
import { AuthContext } from "../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";

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
  readonly profile: IProfileAndConsolidations;
  readonly activeType: STATEMENT_TYPE;
  readonly group: STATEMENT_GROUP;
  readonly onClose: () => void;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { invalidateProfileLogs, invalidateProfileCICStatements } = useContext(
    ReactQueryWrapperContext
  );
  const [value, setValue] = useState<string>(
    STATEMENT_INPUT_INITIAL_VALUE[activeType] || ""
  );

  useEffect(() => {
    setValue(STATEMENT_INPUT_INITIAL_VALUE[activeType] || "");
  }, [activeType]);

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
      invalidateProfileCICStatements(profile);
      invalidateProfileLogs({
        profile,
        keys: {},
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
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
          <div className="sm:tw-flex sm:tw-flex-row-reverse tw-gap-x-3">
            <button
              type="submit"
              className="tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              Save
            </button>
            <button
              onClick={onClose}
              type="button"
              className="tw-mt-3 sm:tw-mt-0 tw-w-full sm:tw-w-auto tw-cursor-pointer tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-iron-600 tw-rounded-lg hover:tw-bg-iron-800 hover:tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
