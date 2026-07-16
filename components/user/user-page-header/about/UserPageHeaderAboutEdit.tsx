"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import ActionButton from "@/components/utils/button/ActionButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";
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
}: {
  readonly profile: ApiIdentity;
  readonly statement: CicStatement | null;
  readonly onClose: () => void;
}) {
  const MAX_STATEMENT_LENGTH = 500;

  const { onProfileStatementAdd } = useContext(ReactQueryWrapperContext);
  const { requestAuth, setToast } = useContext(AuthContext);
  useKeyPressEvent("Escape", onClose);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const profileStatementTarget =
    [profile.query, profile.handle, profile.primary_wallet]
      .map((value) => value?.trim() ?? "")
      .find((value) => value.length > 0) ?? "";

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const { value } = inputRef.current;
      inputRef.current.setSelectionRange(value.length, value.length);
    }
  }, []);

  const [value, setValue] = useState<string>(statement?.statement_value ?? "");

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setErrorMsg(null);
    const newValue = event.target.value;
    if (newValue.length > MAX_STATEMENT_LENGTH) {
      setValue(newValue.substring(0, MAX_STATEMENT_LENGTH));
      return;
    }
    setValue(newValue);
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
      setErrorMsg(null);
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
      setErrorMsg(null);
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
      setErrorMsg(
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
    await addStatementMutation.mutateAsync(value);
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
        <div className="tw-relative">
          <textarea
            className="tw-block tw-min-h-32 tw-w-full tw-resize-none tw-rounded-xl tw-border-0 tw-bg-iron-950/80 tw-px-4 tw-pb-10 tw-pt-3.5 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-50 tw-caret-primary-400 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-200 tw-ease-out placeholder:tw-text-iron-600 hover:tw-ring-white/15 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400/60"
            name="profile-about"
            id="profile-about-input"
            aria-label={getUserProfileHeaderMessage(
              "user.profileHeader.aboutEdit.textareaLabel"
            )}
            aria-describedby="profile-about-character-count"
            placeholder={getUserProfileHeaderMessage(
              "user.profileHeader.aboutEdit.placeholder"
            )}
            maxLength={MAX_STATEMENT_LENGTH}
            required
            value={value}
            onChange={handleInputChange}
            ref={inputRef}
          ></textarea>
          <div
            id="profile-about-character-count"
            className="tw-pointer-events-none tw-absolute tw-bottom-3 tw-right-3 tw-rounded-full tw-bg-black/60 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-500 tw-ring-1 tw-ring-inset tw-ring-white/10"
          >
            {characterCount}
          </div>
        </div>
        <div className="tw-mt-3 tw-flex tw-justify-end">
          <div className="tw-flex tw-w-full tw-gap-2 sm:tw-w-auto">
            <SecondaryButton
              disabled={loading}
              onClicked={onClose}
              className="tw-min-h-11 tw-flex-1 sm:tw-flex-none"
            >
              {getUserProfileHeaderMessage(
                "user.profileHeader.aboutEdit.cancel"
              )}
            </SecondaryButton>
            <ActionButton
              disabled={isDisabled}
              loading={loading}
              onClicked={submitStatement}
              ariaLabel={getUserProfileHeaderMessage(
                "user.profileHeader.aboutEdit.save"
              )}
              className="tw-min-h-11 tw-flex-1 sm:tw-flex-none"
            >
              {getUserProfileHeaderMessage("user.profileHeader.aboutEdit.save")}
            </ActionButton>
          </div>
        </div>
      </form>
      <AnimatePresence mode="wait" initial={false}>
        {errorMsg && (
          <UserPageHeaderAboutEditError
            msg={errorMsg}
            closeError={() => setErrorMsg(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
