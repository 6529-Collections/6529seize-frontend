import type { CommunityMemberMinimal } from "@/entities/IProfile";
import Image from "next/image";

type SelectedIdentity = Pick<
  CommunityMemberMinimal,
  "wallet" | "handle" | "pfp"
>;

interface GroupCreateIdentitySelectedItemsProps {
  readonly selectedIdentities: readonly SelectedIdentity[];
  readonly onRemove: (id: string) => void;
  readonly variant?: "default" | "inline";
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
  const isInline = variant === "inline";

  return (
    <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
      {selectedIdentities.map((identity) => (
        <div
          key={identity.wallet}
          className={
            isInline
              ? "tw-flex tw-items-center tw-gap-x-2 tw-rounded-full tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-ring-white/5"
              : "tw-flex tw-items-center tw-gap-x-3 tw-rounded-lg tw-bg-iron-950 tw-px-2 tw-text-xs tw-font-medium tw-ring-1 tw-ring-inset tw-ring-iron-700"
          }
        >
          <div
            className={
              isInline
                ? "tw-flex tw-items-center tw-gap-x-2"
                : "tw-flex tw-items-center tw-gap-x-2 tw-py-1"
            }
          >
            <div
              className={`tw-relative tw-h-7 tw-w-7 tw-flex-shrink-0 tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 ${
                isInline ? "tw-rounded-full" : "tw-rounded-lg"
              }`}
            >
              <div
                className={`tw-h-full tw-w-full tw-max-w-full tw-overflow-hidden tw-bg-iron-900 ${
                  isInline ? "tw-rounded-full" : "tw-rounded-lg"
                }`}
              >
                <div
                  className={`tw-flex tw-h-full tw-items-center tw-justify-center tw-overflow-hidden tw-text-center ${
                    isInline ? "tw-rounded-full" : "tw-rounded-lg"
                  }`}
                >
                  {identity.pfp ? (
                    // Profile avatars can come from arbitrary remote hosts, so this stays unoptimized.
                    <Image
                      src={identity.pfp}
                      alt={`Profile picture for ${identity.handle ?? "selected profile"}`}
                      fill
                      unoptimized
                      sizes="28px"
                      className="tw-bg-iron-900 tw-bg-transparent tw-object-contain"
                    />
                  ) : (
                    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-800 tw-text-iron-400"></div>
                  )}
                </div>
              </div>
            </div>

            <span className="tw-max-w-48 tw-truncate tw-text-xs tw-font-semibold tw-text-iron-50 sm:tw-max-w-full">
              {handlePrefix}
              {identity.handle}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(identity.wallet)}
            className={
              isInline
                ? "tw-group tw-relative tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-all tw-duration-300 tw-ease-out hover:tw-text-error"
                : "tw-group tw-relative -tw-mr-1.5 tw-flex tw-h-full tw-items-center tw-justify-center tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-iron-700 tw-bg-transparent tw-text-iron-400 tw-transition-all tw-duration-300 tw-ease-out hover:tw-text-error"
            }
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
        </div>
      ))}
    </div>
  );
}
