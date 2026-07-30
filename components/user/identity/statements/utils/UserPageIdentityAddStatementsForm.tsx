"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type {
  ApiCreateOrUpdateProfileCicStatement,
  CicStatement,
} from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { STATEMENT_META } from "@/helpers/Types";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import UserPageIdentityAddStatementsInput from "./UserPageIdentityAddStatementsInput";

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
        type: "error",
        title: "Couldn't add this NIC statement.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
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
          <div className="tw-gap-x-3 sm:tw-flex sm:tw-flex-row-reverse">
            <Button
              type="submit"
              loading={loading}
              size="lg"
              fullWidth
              className="sm:tw-w-auto"
            >
              Save
            </Button>
            <Button
              disabled={loading}
              onClick={onClose}
              variant="secondary"
              size="lg"
              fullWidth
              className="tw-mt-3 sm:tw-mt-0 sm:tw-w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
