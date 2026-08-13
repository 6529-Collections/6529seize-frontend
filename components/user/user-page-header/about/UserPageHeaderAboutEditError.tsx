import UserPageErrorWrapper from "@/components/user/utils/UserPageErrorWrapper";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

enum AboutEditError {
  HATE_SPEECH = "HATE_SPEECH",
  PERSONAL_INSULTS = "PERSONAL_INSULTS",
  INAPPROPRIATE_LANGUAGE = "INAPPROPRIATE_LANGUAGE",
  DOXXING = "DOXXING",
  UNKNOWN = "UNKNOWN",
}

type OmitUnknown = Exclude<AboutEditError, AboutEditError.UNKNOWN>;

const ERROR_REGEX: { [k in OmitUnknown]: RegExp } = {
  [AboutEditError.HATE_SPEECH]: /hate\s+speech/i,
  [AboutEditError.PERSONAL_INSULTS]: /personal\s+insults/i,
  [AboutEditError.INAPPROPRIATE_LANGUAGE]: /inappropriate\s+language/i,
  [AboutEditError.DOXXING]: /doxxing\s+of\s+another\s+person/i,
};

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
  msg,
  closeError,
}: {
  readonly msg: string;
  readonly closeError: () => void;
}) {
  const getAboutErrorType = (msg: string): AboutEditError => {
    for (const errorType in ERROR_REGEX) {
      if (ERROR_REGEX[errorType as OmitUnknown].test(msg)) {
        return errorType as AboutEditError;
      }
    }
    return AboutEditError.UNKNOWN;
  };

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
    <div id="profile-about-error" className="tw-mt-3">
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
