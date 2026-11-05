"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type {
  ApiCreateOrUpdateProfileCicStatement,
  CicStatement,
} from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { STATEMENT_GROUP, STATEMENT_TYPE } from "@/helpers/Types";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { useKeyPressEvent } from "react-use";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";
import UserPageHeaderAboutEditError from "./UserPageHeaderAboutEditError";
import UserPageHeaderAboutInput from "./UserPageHeaderAboutInput";
export default function UserPageHeaderAboutEdit({
  profile,
  statement,
  onClose,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  errorMsg: controlledErrorMsg,
  onErrorMsgChange: controlledOnErrorMsgChange,
  autoFocus = false,
}: {
  readonly profile: ApiIdentity;
  readonly statement: CicStatement | null;
  readonly onClose: () => void;
  readonly value?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly errorMsg?: string | null | undefined;
  readonly onErrorMsgChange?: ((errorMsg: string | null) => void) | undefined;
  readonly autoFocus?: boolean | undefined;
}) {
  const { onProfileStatementAdd, onProfileStatementRemove } = useContext(
    ReactQueryWrapperContext
  );
  const { requestAuth, setToast } = useContext(AuthContext);
  useKeyPressEvent("Escape", onClose);

  const aboutInputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [internalValue, setInternalValue] = useState(
    statement?.statement_value ?? ""
  );
  const [internalErrorMsg, setInternalErrorMsg] = useState<string | null>(null);
  const value = controlledValue ?? internalValue;
  const errorMsg =
    controlledErrorMsg === undefined ? internalErrorMsg : controlledErrorMsg;
  const onValueChange = controlledOnValueChange ?? setInternalValue;
  const onErrorMsgChange = controlledOnErrorMsgChange ?? setInternalErrorMsg;
  const profileStatementTarget =
    [profile.query, profile.handle, profile.primary_wallet]
      .map((value) => value?.trim() ?? "")
      .find((value) => value.length > 0) ?? "";

  useEffect(() => {
    if (!autoFocus || !inputRef.current) {
      return;
    }

    inputRef.current.focus();
    const { value: inputValue } = inputRef.current;
    inputRef.current.setSelectionRange(inputValue.length, inputValue.length);
  }, [autoFocus]);

  const [loading, setLoading] = useState<boolean>(false);
  const isDisabled =
    profileStatementTarget.length === 0 ||
    (!statement && value.trim().length === 0) ||
    statement?.statement_value === value ||
    loading;

  const saveStatementMutation = useMutation({
    mutationFn: async (statementValue: string) => {
      setLoading(true);
      onErrorMsgChange(null);
      if (statement && statementValue.trim().length === 0) {
        await commonApiDelete({
          endpoint: `profiles/${profileStatementTarget}/cic/statements/${statement.id}`,
        });
        return;
      }
      return await commonApiPost<
        ApiCreateOrUpdateProfileCicStatement,
        CicStatement
      >({
        endpoint: `profiles/${profileStatementTarget}/cic/statements`,
        body: {
          statement_group: STATEMENT_GROUP.GENERAL,
          statement_type: STATEMENT_TYPE.BIO,
          statement_comment: null,
          statement_value: statementValue,
        },
      });
    },
    onSuccess: (_data, statementValue) => {
      onErrorMsgChange(null);
      setToast({
        message: getUserProfileHeaderMessage(
          "user.profileHeader.aboutEdit.success"
        ),
        type: "success",
      });
      if (statementValue.trim().length === 0) {
        onProfileStatementRemove({ profile });
      } else {
        onProfileStatementAdd({ profile });
      }
      onClose();
    },
    onError: (error) => {
      onErrorMsgChange(
        getToastErrorDetails(error) ??
          getUserProfileHeaderMessage(
            "user.profileHeader.aboutEdit.errors.saveFailed"
          )
      );
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const submitStatement = async () => {
    if (isDisabled) {
      return;
    }
    const { success } = await requestAuth();
    if (!success) return;
    try {
      await saveStatementMutation.mutateAsync(value);
    } catch {
      // The mutation's onError callback owns the inline error presentation.
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitStatement();
  };
  return (
    <div className="tw-w-full tw-max-w-2xl">
      <form onSubmit={onSubmit}>
        <UserPageHeaderAboutInput
          id={aboutInputId}
          value={value}
          onChange={(nextValue) => {
            onErrorMsgChange(null);
            onValueChange(nextValue);
          }}
          errorMsg={errorMsg}
          required={!statement}
          inputRef={inputRef}
        />
        <div className="tw-mt-3 tw-flex tw-w-full tw-flex-col-reverse tw-gap-2 md:tw-ml-auto md:tw-w-auto md:tw-flex-row">
          <Button
            variant="secondary"
            size="lg"
            disabled={loading}
            onClick={onClose}
            className="tw-hidden tw-min-h-11 md:tw-inline-flex md:tw-flex-none"
          >
            {getUserProfileHeaderMessage("user.profileHeader.aboutEdit.cancel")}
          </Button>
          <Button
            type="submit"
            variant="action"
            size="lg"
            disabled={isDisabled}
            loading={loading}
            aria-label={getUserProfileHeaderMessage(
              "user.profileHeader.aboutEdit.save"
            )}
            className="tw-min-h-11 tw-flex-1 md:tw-flex-none"
          >
            {getUserProfileHeaderMessage("user.profileHeader.aboutEdit.save")}
          </Button>
        </div>
      </form>
      <AnimatePresence mode="wait" initial={false}>
        {errorMsg && (
          <UserPageHeaderAboutEditError
            id={`${aboutInputId}-profile-about-error`}
            msg={errorMsg}
            closeError={() => onErrorMsgChange(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
