import Link from "next/link";
import Image from "next/image";
import { getScaledResolvedImageUri, ImageScale } from "@/helpers/image.helpers";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { useGatewayImageLoadState } from "@/components/common/image/useGatewayImageLoadState";

interface NotificationHeaderProps {
  readonly author: ApiProfileMin;
  readonly children: React.ReactNode; // Content AFTER the user link (e.g. "replied • 2h")
  readonly actions?: React.ReactNode | undefined; // Follow button(s)
  readonly authorClassName?: string | undefined;
}

export default function NotificationHeader({
  author,
  children,
  actions,
  authorClassName = "tw-text-sm",
}: NotificationHeaderProps) {
  const { activeSrc, isPlaceholder, unoptimized, handleError } =
    useGatewayImageLoadState(author.pfp);

  return (
    <div className="tw-flex tw-items-start tw-gap-x-3">
      <div className="tw-relative tw-h-7 tw-w-7 tw-flex-shrink-0">
        {!isPlaceholder && activeSrc ? (
          <Image
            key={`${activeSrc}-${unoptimized ? "unoptimized" : "optimized"}`}
            src={getScaledResolvedImageUri(activeSrc, ImageScale.W_AUTO_H_50)}
            alt={author.handle ?? "User profile"}
            fill
            sizes="28px"
            unoptimized={unoptimized}
            onError={handleError}
            className="tw-flex-shrink-0 tw-rounded-md tw-bg-iron-800 tw-object-contain tw-ring-1 tw-ring-iron-700"
          />
        ) : (
          <div className="tw-h-full tw-w-full tw-flex-shrink-0 tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
        )}
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-2">
        <div className="tw-flex tw-min-w-[min(100%,16rem)] tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-1">
          <UserProfileTooltipWrapper user={author.handle ?? ""}>
            <Link
              href={`/${author.handle}`}
              className={`${authorClassName} tw-font-semibold tw-text-iron-50 tw-no-underline`}
            >
              {author.handle}
            </Link>
          </UserProfileTooltipWrapper>
          {children}
        </div>
        {actions && <div className="tw-max-w-full tw-flex-none">{actions}</div>}
      </div>
    </div>
  );
}
