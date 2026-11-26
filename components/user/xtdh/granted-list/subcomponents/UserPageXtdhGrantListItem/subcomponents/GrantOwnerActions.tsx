import CompactMenuMobileBottomSheet from "@/components/compact-menu/CompactMenuMobileBottomSheet";
import IconButton from "@/components/utils/button/IconButton";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import {
  EllipsisVerticalIcon,
  StopIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function GrantOwnerActions({
  isStopping,
  isRevoking,
  onStop,
  onRevoke,
}: {
  readonly isStopping: boolean;
  readonly isRevoking: boolean;
  readonly onStop: () => void;
  readonly onRevoke: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <>
      <div className="md:tw-hidden">
        <CompactMenuMobileBottomSheet
          title={t(locale, "xtdh.grant.actions")}
          ariaLabel={t(locale, "xtdh.grant.actions")}
          disabled={isStopping || isRevoking}
          trigger={
            <EllipsisVerticalIcon aria-hidden="true" className="tw-size-5" />
          }
          renderTriggerButton={({
            ariaLabel,
            ariaExpanded,
            disabled,
            onClick,
          }) => (
            <IconButton
              variant="muted"
              size={24}
              expandTouchTarget
              aria-label={ariaLabel}
              aria-haspopup="dialog"
              aria-expanded={ariaExpanded}
              disabled={disabled}
              onClick={onClick}
            >
              <EllipsisVerticalIcon aria-hidden="true" className="tw-size-5" />
            </IconButton>
          )}
          items={[
            {
              id: "stop",
              label: t(locale, "xtdh.grant.stopAction"),
              icon: <StopIcon aria-hidden="true" className="tw-size-5" />,
              onSelect: onStop,
            },
            {
              id: "revoke",
              label: t(locale, "xtdh.grant.revokeAction"),
              icon: <TrashIcon aria-hidden="true" className="tw-size-5" />,
              onSelect: onRevoke,
              className:
                "tw-mt-2 !tw-rounded-none !tw-border-t !tw-border-solid !tw-border-white/10 !tw-text-red",
            },
          ]}
        />
      </div>
      <div className="tw-hidden tw-items-center tw-gap-2 md:tw-flex">
        <CustomTooltip content={t(locale, "xtdh.grant.stopAction")}>
          <button
            aria-label={t(locale, "xtdh.grant.stopAction")}
            onClick={onStop}
            disabled={isStopping || isRevoking}
            className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-p-0 tw-text-iron-300 tw-shadow-none tw-transition-colors hover:tw-bg-iron-700 hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          >
            {isStopping ? (
              <svg
                className="tw-h-4 tw-w-4 tw-animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="tw-opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="tw-opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="tw-h-5 tw-w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </CustomTooltip>
        <CustomTooltip content={t(locale, "xtdh.grant.revokeAction")}>
          <button
            aria-label={t(locale, "xtdh.grant.revokeAction")}
            onClick={onRevoke}
            disabled={isStopping || isRevoking}
            className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-red/10 tw-p-0 tw-text-red tw-shadow-none tw-transition-colors hover:tw-bg-red/20 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          >
            {isRevoking ? (
              <svg
                className="tw-h-4 tw-w-4 tw-animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="tw-opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="tw-opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="tw-h-5 tw-w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </CustomTooltip>
      </div>
    </>
  );
}
