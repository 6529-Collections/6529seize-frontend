"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type {
  ApiCreateOrUpdateProfileCicStatement,
  CicStatement,
} from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  STATEMENT_GROUP,
  STATEMENT_META,
  STATEMENT_TYPE,
} from "@/helpers/Types";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useState } from "react";
import UserPageIdentityAddStatementsInput from "./UserPageIdentityAddStatementsInput";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageIdentityAddStatementsCustomLinkFields from "../add/nft-accounts/UserPageIdentityAddStatementsCustomLinkFields";

interface StatementFormValue {
  readonly comment: string | null;
  readonly value: string;
}

export default function UserPageIdentityAddStatementsForm({
  activeType,
  group,
  ...props
}: {
  readonly profile: ApiIdentity;
  readonly activeType: STATEMENT_TYPE;
  readonly group: STATEMENT_GROUP;
  readonly onClose: () => void;
}) {
  return (
    <UserPageIdentityAddStatementsFormContent
      key={`${group}-${activeType}`}
      activeType={activeType}
      group={group}
      {...props}
    />
  );
}

function UserPageIdentityAddStatementsFormContent({
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
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useContext(AuthContext);
  const { onProfileStatementAdd } = useContext(ReactQueryWrapperContext);
  const [value, setValue] = useState<string>(
    STATEMENT_META[activeType].inputInitialValue
  );
  const [comment, setComment] = useState("");
  const isCustomArtLink =
    group === STATEMENT_GROUP.NFT_ACCOUNTS &&
    activeType === STATEMENT_TYPE.LINK;

  const addStatementMutation = useMutation({
    mutationFn: (statement: StatementFormValue) =>
      commonApiPost<ApiCreateOrUpdateProfileCicStatement, CicStatement>({
        endpoint: `profiles/${profile.query}/cic/statements`,
        body: {
          statement_group: group,
          statement_type: activeType,
          statement_comment: statement.comment,
          statement_value: statement.value,
        },
      }),
    onSuccess: () => {
      setToast({
        message: t(locale, "user.profile.identity.statements.addSuccess"),
        type: "success",
      });
      onProfileStatementAdd({
        profile,
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "user.profile.identity.statements.addErrorTitle"),
        description: t(
          locale,
          "user.profile.identity.statements.addErrorDescription"
        ),
        details: getToastErrorDetails(error),
      });
    },
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value || (isCustomArtLink && !comment.trim())) return;
    const { success } = await requestAuth();
    if (!success) return;
    addStatementMutation.mutate(
      {
        comment: isCustomArtLink ? comment.trim() : null,
        value,
      },
      {
        onSuccess: () => {
          setValue("");
          setComment("");
          onClose();
        },
      }
    );
  };
  return (
    <div className="tw-mt-4">
      <form onSubmit={onSubmit}>
        {isCustomArtLink ? (
          <UserPageIdentityAddStatementsCustomLinkFields
            label={comment}
            url={value}
            onLabelChange={setComment}
            onUrlChange={setValue}
          />
        ) : (
          <UserPageIdentityAddStatementsInput
            activeType={activeType}
            value={value}
            onChange={setValue}
          />
        )}

        <div className="tw-mt-8">
          <div className="tw-gap-x-3 sm:tw-flex sm:tw-flex-row-reverse">
            <Button
              type="submit"
              loading={addStatementMutation.isPending}
              size="lg"
              fullWidth
              className="sm:tw-w-auto"
            >
              {t(locale, "user.profile.identity.statements.save")}
            </Button>
            <Button
              disabled={addStatementMutation.isPending}
              onClick={onClose}
              variant="secondary"
              size="lg"
              fullWidth
              className="tw-mt-3 sm:tw-mt-0 sm:tw-w-auto"
            >
              {t(locale, "user.profile.identity.statements.cancel")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
