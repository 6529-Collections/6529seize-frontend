import type { CommunityMemberMinimal } from "@/entities/IProfile";
import Image from "next/image";

type SelectedIdentity = Pick<
  CommunityMemberMinimal,
  "wallet" | "handle" | "pfp"
>;

interface GroupCreateIdentitySelectedItemsProps {
  readonly selectedIdentities: readonly SelectedIdentity[];
  readonly onRemove?: (id: string) => void;
  readonly variant?: "default" | "inline" | "inlineQuiet" | "quickTag";
  readonly handlePrefix?: string;
  readonly getRemoveLabel?: (identity: SelectedIdentity) => string;
}

export default function GroupCreateIdentitySelectedItems({
  selectedIdentities,
  onRemove,
  variant = "default",
  handlePrefix = "",
  getRemoveLabel = () => "Remove",
}: GroupCreateIdentitySelectedItemsProps) {
  const isInlineQuiet = variant === "inlineQuiet";
  const isInline = variant === "inline" || isInlineQuiet;
  const isQuickTag = variant === "quickTag";
  const isRounded = isInline || isQuickTag;
  const roundedClass = isRounded ? "tw-rounded-full" : "tw-rounded-lg";
  let selectedItemClass =
    "tw-flex tw-items-center tw-gap-x-3 tw-rounded-lg tw-bg-iron-950 tw-px-2 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-ring-iron-700";
  if (isInline) {
    selectedItemClass =
      "tw-flex tw-items-center tw-gap-x-2 tw-rounded-full tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-ring-white/5";
  } else if (isQuickTag) {
    selectedItemClass =
      "tw-flex tw-items-center tw-gap-x-2 tw-rounded-full tw-bg-iron-900/70 tw-py-1.5 tw-pl-1.5 tw-pr-2 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-ring-white/10";
  }
  if (isInlineQuiet) {
    selectedItemClass =
      "tw-flex tw-min-h-11 tw-w-full tw-min-w-0 tw-items-center tw-justify-between tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-transparent tw-text-xs tw-font-medium";
  }
  let selectedItemsContainerClass =
    "tw-mt-3 tw-flex tw-flex-wrap tw-gap-2 empty:tw-hidden";
  if (isInline) {
    selectedItemsContainerClass =
      "tw-flex tw-flex-wrap tw-gap-2 empty:tw-hidden";
  } else if (isQuickTag) {
    selectedItemsContainerClass =
      "tw-mt-2 tw-flex tw-flex-wrap tw-gap-1.5 empty:tw-hidden";
  }
  if (isInlineQuiet) {
    selectedItemsContainerClass =
      "tw-flex tw-w-full tw-flex-col empty:tw-hidden";
  }
  let contentClass = "tw-flex tw-items-center tw-gap-x-2 tw-py-1";
  if (isRounded) {
    contentClass = "tw-flex tw-items-center tw-gap-x-2";
  }
  if (isInlineQuiet) {
    contentClass = "tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-2";
  }
  const nameColorClass = isQuickTag ? "tw-text-iron-100" : "tw-text-iron-50";
  const nameClass = isInlineQuiet
    ? "tw-min-w-0 tw-flex-1 tw-truncate tw-text-[13px] tw-font-medium tw-text-iron-100"
    : `tw-max-w-48 tw-truncate tw-text-xs tw-font-semibold sm:tw-max-w-full ${nameColorClass}`;
  let removeClass =
    "tw-group tw-relative -tw-mr-1.5 tw-flex tw-h-full tw-items-center tw-justify-center tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-iron-700 tw-bg-transparent tw-text-iron-400 tw-transition-all tw-duration-300 tw-ease-out hover:tw-text-error";
  if (isRounded) {
    removeClass =
      "tw-group tw-relative tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-text-error";
  }
  if (isInlineQuiet) {
    removeClass =
      "tw-group tw-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-error";
  }
  const fallbackAvatar = (
    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-800 tw-text-iron-400" />
  );

  return (
    <div className={selectedItemsContainerClass}>
      {selectedIdentities.map((identity) => (
        <div key={identity.wallet} className={selectedItemClass}>
          <div className={contentClass}>
            <div
              className={`tw-relative tw-size-7 tw-flex-shrink-0 tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 ${roundedClass}`}
            >
              <div
                className={`tw-h-full tw-w-full tw-max-w-full tw-overflow-hidden tw-bg-iron-900 ${roundedClass}`}
              >
                <div
                  className={`tw-flex tw-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-text-center ${roundedClass}`}
                >
                  {identity.pfp ? (
                    // Profile avatars can come from arbitrary remote hosts, so this stays unoptimized.
                    <Image
                      src={identity.pfp}
                      alt={`Profile picture for ${identity.handle ?? "selected profile"}`}
                      fill
                      unoptimized
                      sizes="28px"
                      className="tw-object-contain"
                    />
                  ) : (
                    fallbackAvatar
                  )}
                </div>
              </div>
            </div>

            <span className={nameClass}>
              {handlePrefix}
              {identity.handle}
            </span>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(identity.wallet)}
              className={removeClass}
            >
              <span className="tw-sr-only">{getRemoveLabel(identity)}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="tw-size-4 tw-flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
