"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
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
          "Couldn't save this about statement. Please try again."
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
    <div className="tw-w-full tw-max-w-xl">
      <form onSubmit={onSubmit}>
        <textarea
          className="tw-form-input tw-block tw-min-h-28 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3.5 tw-py-3 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
          name="profile-about"
          id="profile-about-input"
          aria-label={getUserProfileHeaderMessage(
            "user.profileHeader.aboutEdit.textareaLabel"
          )}
          placeholder={getUserProfileHeaderMessage(
            "user.profileHeader.aboutEdit.placeholder"
          )}
          required
          value={value}
          onChange={handleInputChange}
          ref={inputRef}
          style={{ resize: "none" }}
        ></textarea>
        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <div className="tw-text-xs tw-font-medium tw-text-iron-500">
            {characterCount}
          </div>
          <div className="tw-flex tw-w-full tw-gap-2 sm:tw-w-auto">
            <SecondaryButton disabled={loading} onClicked={onClose}>
              {getUserProfileHeaderMessage(
                "user.profileHeader.aboutEdit.cancel"
              )}
            </SecondaryButton>
            <PrimaryButton
              disabled={isDisabled}
              loading={loading}
              onClicked={submitStatement}
              ariaLabel={getUserProfileHeaderMessage(
                "user.profileHeader.aboutEdit.save"
              )}
              hideChildrenWhenLoading
            >
              {getUserProfileHeaderMessage("user.profileHeader.aboutEdit.save")}
            </PrimaryButton>
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
