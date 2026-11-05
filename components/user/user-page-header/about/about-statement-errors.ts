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
