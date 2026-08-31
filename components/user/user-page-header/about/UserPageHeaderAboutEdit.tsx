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
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useContext, useEffect, useRef, useState } from "react";
import { useKeyPressEvent } from "react-use";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";
import UserPageHeaderAboutEditError from "./UserPageHeaderAboutEditError";
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
  const MAX_STATEMENT_LENGTH = 500;

  const { onProfileStatementAdd } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast } = useContext(AuthContext);
  useKeyPressEvent("Escape", onClose);

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

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onErrorMsgChange(null);
    const newValue = event.target.value;
    if (newValue.length > MAX_STATEMENT_LENGTH) {
      onValueChange(newValue.substring(0, MAX_STATEMENT_LENGTH));
      return;
    }
    onValueChange(newValue);
  };

  const [loading, setLoading] = useState<boolean>(false);
  const isDisabled =
    profileStatementTarget.length === 0 ||
    value.trim().length === 0 ||
    statement?.statement_value === value ||
    loading;

  const addStatementMutation = useMutation({
    mutationFn: async (statementValue: string) => {
      setLoading(true);
      onErrorMsgChange(null);
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
    onSuccess: () => {
      onErrorMsgChange(null);
      setToast({
        message: getUserProfileHeaderMessage(
          "user.profileHeader.aboutEdit.success"
        ),
        type: "success",
      });
      onProfileStatementAdd({
        profile,
      });
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
    if (profileStatementTarget.length === 0 || value.trim().length === 0) {
      return;
    }
    const { success } = await requestAuth();
    if (!success) return;
    try {
      await addStatementMutation.mutateAsync(value);
    } catch {
      // The mutation's onError callback owns the inline error presentation.
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitStatement();
  };
  const characterCount = getUserProfileHeaderMessage(
    "user.profileHeader.aboutEdit.characterCount",
    {
      count: formatInteger(DEFAULT_LOCALE, value.length),
      max: formatInteger(DEFAULT_LOCALE, MAX_STATEMENT_LENGTH),
    }
  );

  return (
    <div className="tw-w-full tw-max-w-2xl">
      <form onSubmit={onSubmit}>
        <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-200 tw-ease-out focus-within:tw-ring-2 focus-within:tw-ring-inset focus-within:tw-ring-primary-400/60 hover:tw-ring-white/15">
          <textarea
            className="tw-block tw-min-h-32 tw-w-full tw-resize-none tw-border-0 tw-bg-transparent tw-px-4 tw-pb-2 tw-pt-3.5 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-50 tw-caret-primary-400 placeholder:tw-text-iron-600 focus:tw-outline-none"
            name="profile-about"
            id="profile-about-input"
            aria-label={getUserProfileHeaderMessage(
              "user.profileHeader.aboutEdit.textareaLabel"
            )}
            aria-describedby={
              errorMsg
                ? "profile-about-character-count profile-about-error"
                : "profile-about-character-count"
            }
            placeholder={getUserProfileHeaderMessage(
              "user.profileHeader.aboutEdit.placeholder"
            )}
            maxLength={MAX_STATEMENT_LENGTH}
            required
            value={value}
            onChange={handleInputChange}
            ref={inputRef}
          ></textarea>
          <div className="tw-flex tw-justify-end tw-px-3 tw-pb-2">
            <div
              id="profile-about-character-count"
              className="tw-pointer-events-none tw-rounded-full tw-bg-black/60 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-500 tw-ring-1 tw-ring-inset tw-ring-white/10"
            >
              {characterCount}
            </div>
          </div>
        </div>
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
            msg={errorMsg}
            closeError={() => onErrorMsgChange(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
