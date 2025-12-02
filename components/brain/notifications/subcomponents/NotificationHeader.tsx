import Link from "next/link";
import Image from "next/image";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { parseIpfsUrl } from "@/helpers/Helpers";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";

interface NotificationHeaderProps {
  readonly author: ApiProfileMin;
  readonly children: React.ReactNode; // Content AFTER the user link (e.g. "replied • 2h")
  readonly actions?: React.ReactNode; // Follow button(s)
}

export default function NotificationHeader({
  author,
  children,
  actions,
}: NotificationHeaderProps) {
  return (
    <div className="tw-flex tw-items-start tw-gap-x-3">
      <div className="tw-h-7 tw-w-7 tw-flex-shrink-0 tw-relative">
        {author.pfp ? (
          <Image
            src={getScaledImageUri(parseIpfsUrl(author.pfp), ImageScale.W_AUTO_H_50)}
            alt={author.handle ?? "User profile"}
            fill
            sizes="28px"
            className="tw-flex-shrink-0 tw-object-contain tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
          />
        ) : (
          <div className="tw-flex-shrink-0 tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
        )}
      </div>
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start min-[390px]:tw-flex-row min-[390px]:tw-justify-between min-[390px]:tw-items-center tw-gap-y-2 min-[390px]:tw-gap-x-2 tw-min-w-0">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1">
          <UserProfileTooltipWrapper user={author.handle ?? ""}>
            <Link
              href={`/${author.handle}`}
              className="tw-no-underline tw-font-semibold tw-text-sm tw-text-iron-50">
              {author.handle}
            </Link>
          </UserProfileTooltipWrapper>
          {children}
        </div>
        {actions && (
          <div className="tw-flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
