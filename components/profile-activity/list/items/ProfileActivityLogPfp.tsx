import { PROFILE_ACTIVITY_BODY } from "@/components/profile-activity/profileActivityTypography";
import type { ProfileActivityLogPfpEdit } from "@/entities/IProfile";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import Image from "next/image";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogPfp({
  log,
}: {
  readonly log: ProfileActivityLogPfpEdit;
}) {
  const isAdded = !log.contents.old_value;
  return (
    <>
      <ProfileActivityLogItemAction action={isAdded ? "added" : "changed"} />
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        profile picture
      </span>

      {!isAdded && (
        <>
          <div className="tw-pl-1">
            {log.contents.old_value && (
              <Image
                unoptimized
                src={getScaledImageUri(
                  log.contents.old_value,
                  ImageScale.W_AUTO_H_50
                )}
                alt="Profile picture"
                width="20"
                height="20"
                className="tw-h-auto tw-max-h-10 tw-w-auto tw-min-w-10 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-800 tw-object-contain tw-ring-2 tw-ring-white/30"
              />
            )}
          </div>
          <svg
            className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 12H20M20 12L14 6M20 12L14 18"
              stroke="currentcOLOR"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}

      <div className="tw-ml-2">
        <Image
          unoptimized
          src={getScaledImageUri(
            log.contents.new_value,
            ImageScale.W_AUTO_H_50
          )}
          alt="Profile picture"
          width="20"
          height="20"
          className="tw-h-auto tw-max-h-10 tw-w-auto tw-min-w-10 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-800 tw-object-contain tw-ring-2 tw-ring-white/30"
        />
      </div>
    </>
  );
}
