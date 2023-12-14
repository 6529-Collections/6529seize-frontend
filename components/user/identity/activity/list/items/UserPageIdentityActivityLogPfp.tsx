import {
  IProfileAndConsolidations,
  ProfileActivityLogPfpEdit,
} from "../../../../../../entities/IProfile";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import Image from "next/image";

export default function UserPageIdentityActivityLogPfp({
  log,
  profile,
}: {
  log: ProfileActivityLogPfpEdit;
  profile: IProfileAndConsolidations;
}) {
  const isAdded = !log.contents.old_value;
  return (
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center tw-justify-between">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <div className="tw-inline-flex tw-items-center">
            <div className="tw-inline-flex tw-items-center tw-space-x-1.5 tw-mr-3">
              <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-neutral-100">
                {profile?.profile?.handle}
              </span>
              <span className="tw-whitespace-nowrap tw-text-sm tw-text-neutral-400 tw-font-semibold">
                {isAdded ? "added" : "changed"}
              </span>
              <span className="tw-whitespace-nowrap tw-text-sm tw-text-neutral-400 tw-font-medium">
                profile picture
              </span>
            </div>
            {!isAdded && (
              <>
                <div className="tw-mr-2">
                  {log.contents.old_value && (
                    <Image
                      src={log.contents.old_value}
                      alt="Profile picture"
                      width="20"
                      height="20"
                      className="tw-flex-shrink-0 tw-object-contain tw-max-h-10 tw-min-w-10 tw-w-auto tw-h-auto tw-rounded-sm tw-ring-2 tw-ring-white/30 tw-bg-iron-800"
                    />
                  )}
                </div>
                <svg
                  className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-400"
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
                src={log.contents.new_value}
                alt="Profile picture"
                width="20"
                height="20"
                className="tw-flex-shrink-0 tw-object-contain tw-max-h-10 tw-min-w-10 tw-w-auto tw-h-auto tw-rounded-sm tw-ring-2 tw-ring-white/30 tw-bg-iron-800"
              />
            </div>
          </div>
        </div>
      </td>
      <td className="tw-py-4 tw-pl-3">
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
