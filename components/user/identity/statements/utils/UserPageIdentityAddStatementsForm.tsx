"use client";

import { useContext, useEffect, useState } from "react";
import {
  STATEMENT_GROUP,
  STATEMENT_META,
  STATEMENT_TYPE,
} from "../../../../../helpers/Types";
import UserPageIdentityAddStatementsInput from "./UserPageIdentityAddStatementsInput";
import {
  ApiCreateOrUpdateProfileCicStatement,
  CicStatement,
} from "../../../../../entities/IProfile";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../services/api/common-api";
import { AuthContext } from "../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";
export default function UserPageIdentityAddStatementsForm({
  profile,
  activeType,
  group,
  onClose,
}: {
  readonly profile: ApiIdentity;
  readonly activeType: STATEMENT_TYPE;
  readonly group: STATEMENT_GROUP;
  readonly onClose: () => void;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { onProfileStatementAdd } = useContext(ReactQueryWrapperContext);
  const [value, setValue] = useState<string>(
    STATEMENT_META[activeType].inputInitialValue
  );

  useEffect(() => {
    setValue(STATEMENT_META[activeType].inputInitialValue);
  }, [activeType]);

  const [loading, setLoading] = useState(false);

  const addStatementMutation = useMutation({
    mutationFn: async (statement: string) => {
      setLoading(true);
      return await commonApiPost<
        ApiCreateOrUpdateProfileCicStatement,
        CicStatement
      >({
        endpoint: `profiles/${profile.query}/cic/statements`,
        body: {
          statement_group: group,
          statement_type: activeType,
          statement_comment: null,
          statement_value: statement,
        },
      });
    },
    onSuccess: () => {
      setToast({
        message: "NIC statement added.",
        type: "success",
      });
      onProfileStatementAdd({
        profile,
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setLoading(false);
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
              disabled={loading}
              type="submit"
              className={`
              tw-w-full sm:tw-w-auto  tw-flex tw-items-center tw-justify-center tw-relative tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-rounded-lg tw-transition tw-duration-300 tw-ease-out ${
                loading
                  ? "tw-cursor-not-allowed tw-bg-iron-400 tw-border-iron-400"
                  : "tw-cursor-pointer tw-bg-primary-500 tw-border-primary-500 hover:tw-bg-primary-600 hover:tw-border-primary-600"
              }`}>
              <div style={{ visibility: loading ? "hidden" : "visible" }}>
                Save
              </div>
              {loading && (
                <svg
                  aria-hidden="true"
                  role="output"
                  className="tw-inline tw-w-5 tw-h-5 tw-text-primary-400 tw-animate-spin tw-absolute"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    className="tw-text-neutral-600"
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"></path>
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"></path>
                </svg>
              )}
            </button>
            <button
              disabled={loading}
              onClick={onClose}
              type="button"
              className={`tw-mt-3 sm:tw-mt-0 tw-w-full sm:tw-w-auto tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg  tw-transition tw-duration-300 tw-ease-out  ${
                loading
                  ? "tw-cursor-not-allowed"
                  : "hover:tw-bg-iron-800 hover:tw-border-iron-700"
              }`}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
