import { DEFAULT_ERROR_MESSAGE } from "./constants";

interface NotificationErrorDetails {
  readonly message: string;
  readonly isUnauthorized: boolean;
}

export const getNotificationErrorDetails = (
  error: unknown
): NotificationErrorDetails => {
  const status =
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status ??
    (error as { cause?: { status?: number } })?.cause?.status;

  if (error instanceof Error) {
    const message = error.message?.trim() || DEFAULT_ERROR_MESSAGE;
    return {
      message,
      isUnauthorized: status === 401 || /unauthorized/i.test(message),
    };
  }

  if (typeof error === "string") {
    const message = error.trim() || DEFAULT_ERROR_MESSAGE;
    return {
      message,
      isUnauthorized: status === 401 || /unauthorized/i.test(message),
    };
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
    isUnauthorized: status === 401,
  };
};
