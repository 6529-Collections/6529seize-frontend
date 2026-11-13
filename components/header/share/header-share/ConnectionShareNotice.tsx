import Button from "@/components/utils/button/Button";
import { t } from "@/i18n/messages";
import { HEADER_SHARE_LOCALE } from "./constants";
import type { ConnectionShareStatus } from "./shareUtils";

const COPY = {
  "legacy-auth": [
    "headerShare.connectionNotice.legacyTitle",
    "headerShare.connectionNotice.legacyMessage",
  ],
  loading: [
    "headerShare.connectionNotice.loadingTitle",
    "headerShare.connectionNotice.loadingMessage",
  ],
  error: [
    "headerShare.connectionNotice.errorTitle",
    "headerShare.connectionNotice.errorMessage",
  ],
  unauthenticated: [
    "headerShare.connectionNotice.unauthenticatedTitle",
    "headerShare.connectionNotice.unauthenticatedMessage",
  ],
} as const;

export function ConnectionShareNotice({
  status,
  onClose,
  onUpdate,
}: {
  readonly status: ConnectionShareStatus;
  readonly onClose: () => void;
  readonly onUpdate: () => void;
}) {
  const [title, message] =
    COPY[status === "ready" ? "unauthenticated" : status];
  return (
    <div
      data-testid="connection-share-notice"
      data-status={status}
      className={`tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-5 tw-p-8 tw-text-center ${status === "loading" ? "" : "tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/50"}`}
    >
      <div className="tw-flex tw-flex-col tw-gap-2">
        <div className="tw-text-lg tw-font-semibold tw-text-iron-50">
          {t(HEADER_SHARE_LOCALE, title)}
        </div>
        <div className="tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(HEADER_SHARE_LOCALE, message)}
        </div>
      </div>
      {status === "legacy-auth" ? (
        <div className="tw-flex tw-w-full tw-gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="tw-flex-1"
            onClick={onClose}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.connectionNotice.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="tw-flex-1"
            onClick={onUpdate}
          >
            {t(HEADER_SHARE_LOCALE, "headerShare.connectionNotice.update")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
