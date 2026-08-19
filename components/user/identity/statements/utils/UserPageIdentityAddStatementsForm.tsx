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
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useContext, useState } from "react";
import UserPageIdentityAddStatementsInput from "./UserPageIdentityAddStatementsInput";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageIdentityAddStatementsCustomLinkFields from "../add/nft-accounts/UserPageIdentityAddStatementsCustomLinkFields";
import { isHttpsUrl } from "./statement-input.utils";

type AddStatementMutation = UseMutationResult<
  CicStatement,
  Error,
  ApiCreateOrUpdateProfileCicStatement
>;

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
  const locale = useBrowserLocale();
  const { setToast } = useContext(AuthContext);
  const { onProfileStatementAdd } = useContext(ReactQueryWrapperContext);
  const addStatementMutation = useMutation<
    CicStatement,
    Error,
    ApiCreateOrUpdateProfileCicStatement
  >({
    mutationFn: (statement) => {
      if (!profile.query) {
        throw new Error(
          "Cannot add a profile statement without a profile query"
        );
      }
      return commonApiPost<ApiCreateOrUpdateProfileCicStatement, CicStatement>({
        endpoint: `profiles/${profile.query}/cic/statements`,
        body: statement,
      });
    },
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

  return (
    <UserPageIdentityAddStatementsFormContent
      key={`${group}-${activeType}`}
      activeType={activeType}
      group={group}
      addStatementMutation={addStatementMutation}
      onClose={onClose}
    />
  );
}

function UserPageIdentityAddStatementsFormContent({
  activeType,
  group,
  onClose,
  addStatementMutation,
}: {
  readonly activeType: STATEMENT_TYPE;
  readonly group: STATEMENT_GROUP;
  readonly onClose: () => void;
  readonly addStatementMutation: AddStatementMutation;
}) {
  const locale = useBrowserLocale();
  const { requestAuth } = useContext(AuthContext);
  const [value, setValue] = useState<string>(
    STATEMENT_META[activeType].inputInitialValue
  );
  const [comment, setComment] = useState("");
  const [showLabelError, setShowLabelError] = useState(false);
  const isCustomArtLink =
    group === STATEMENT_GROUP.NFT_ACCOUNTS &&
    activeType === STATEMENT_TYPE.LINK;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addStatementMutation.isPending || !value) return;
    if (isCustomArtLink && !comment.trim()) {
      setShowLabelError(true);
      return;
    }
    if (group === STATEMENT_GROUP.NFT_ACCOUNTS && !isHttpsUrl(value)) return;
    const { success } = await requestAuth();
    if (!success) return;
    addStatementMutation.mutate(
      {
        statement_group: group,
        statement_type: activeType,
        statement_comment: isCustomArtLink ? comment.trim() : null,
        statement_value: value,
      },
      {
        onSuccess: () => {
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
            showLabelError={showLabelError}
            onLabelChange={(nextLabel) => {
              setComment(nextLabel);
              if (nextLabel.trim()) setShowLabelError(false);
            }}
            onUrlChange={setValue}
          />
        ) : (
          <UserPageIdentityAddStatementsInput
            activeType={activeType}
            value={value}
            onChange={setValue}
            requireHttps={group === STATEMENT_GROUP.NFT_ACCOUNTS}
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
