import UserPageErrorWrapper from "@/components/user/utils/UserPageErrorWrapper";
import {
  AboutEditError,
  getAboutErrorType,
  type OmitUnknown,
} from "./about-statement-errors";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

const getErrorText = (): {
  [k in OmitUnknown]: {
    title: string;
    value: string;
  };
} => ({
  [AboutEditError.HATE_SPEECH]: {
    title: getUserProfileHeaderMessage(
      "user.profileHeader.aboutEdit.errors.hateSpeech.title"
    ),
    value: getUserProfileHeaderMessage(
      "user.profileHeader.aboutEdit.errors.hateSpeech.value"
    ),
  },
  [AboutEditError.PERSONAL_INSULTS]: {
    title: getUserProfileHeaderMessage(
      "user.profileHeader.aboutEdit.errors.personalInsults.title"
    ),
    value: getUserProfileHeaderMessage(
      "user.profileHeader.aboutEdit.errors.personalInsults.value"
    ),
  },
  [AboutEditError.INAPPROPRIATE_LANGUAGE]: {
    title: getUserProfileHeaderMessage(
      "user.profileHeader.aboutEdit.errors.inappropriateLanguage.title"
    ),
    value: getUserProfileHeaderMessage(
      "user.profileHeader.aboutEdit.errors.inappropriateLanguage.value"
    ),
  },
  [AboutEditError.DOXXING]: {
    title: getUserProfileHeaderMessage(
      "user.profileHeader.aboutEdit.errors.doxxing.title"
    ),
    value: getUserProfileHeaderMessage(
      "user.profileHeader.aboutEdit.errors.doxxing.value"
    ),
  },
});

export default function UserPageHeaderAboutEditError({
  id = "profile-about-error",
  msg,
  closeError,
}: {
  readonly id?: string;
  readonly msg: string;
  readonly closeError: () => void;
}) {
  const errorType = getAboutErrorType(msg);

  const errorText =
    errorType === AboutEditError.UNKNOWN
      ? {
          title: getUserProfileHeaderMessage(
            "user.profileHeader.aboutEdit.errors.unknown.title"
          ),
          value: msg,
        }
      : getErrorText()[errorType];

  return (
    <div id={id} className="tw-mt-3">
      <UserPageErrorWrapper
        closeError={closeError}
        closeLabel={getUserProfileHeaderMessage(
          "user.profileHeader.aboutEdit.errors.close"
        )}
        fullWidth
      >
        <div className="lg:tw-max-w-xl">
          <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-error">
            {errorText.title}
          </h3>
          <p className="tw-mb-0 tw-mt-1.5 tw-break-words tw-text-left tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-300">
            {errorText.value}
          </p>
        </div>
      </UserPageErrorWrapper>
    </div>
  );
}
