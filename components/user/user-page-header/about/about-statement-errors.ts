import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { getUserProfileHeaderMessage } from "../user-page-header.messages";

export enum AboutEditError {
  HATE_SPEECH = "HATE_SPEECH",
  PERSONAL_INSULTS = "PERSONAL_INSULTS",
  INAPPROPRIATE_LANGUAGE = "INAPPROPRIATE_LANGUAGE",
  DOXXING = "DOXXING",
  UNKNOWN = "UNKNOWN",
}

export type OmitUnknown = Exclude<AboutEditError, AboutEditError.UNKNOWN>;

const ERROR_REGEX: { [k in OmitUnknown]: RegExp } = {
  [AboutEditError.HATE_SPEECH]: /hate\s+speech/i,
  [AboutEditError.PERSONAL_INSULTS]: /personal\s+insults/i,
  [AboutEditError.INAPPROPRIATE_LANGUAGE]: /inappropriate\s+language/i,
  [AboutEditError.DOXXING]: /doxxing\s+of\s+another\s+person/i,
};

export const getAboutErrorType = (msg: string): AboutEditError => {
  for (const errorType in ERROR_REGEX) {
    if (ERROR_REGEX[errorType as OmitUnknown].test(msg)) {
      return errorType as AboutEditError;
    }
  }
  return AboutEditError.UNKNOWN;
};

export class AboutStatementSaveError extends Error {
  readonly type: AboutEditError;

  constructor(cause: unknown) {
    let rawMessage = "";
    if (cause instanceof Error) rawMessage = cause.message;
    else if (typeof cause === "string") rawMessage = cause;
    super(
      getToastErrorDetails(cause) ??
        getUserProfileHeaderMessage(
          "user.profileHeader.aboutEdit.errors.saveFailed"
        )
    );
    this.type = getAboutErrorType(rawMessage);
  }
}
