import Link from "next/link";
import Image from "next/image";
import { getScaledResolvedImageUri, ImageScale } from "@/helpers/image.helpers";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { useGatewayImageLoadState } from "@/components/common/image/useGatewayImageLoadState";
import { AnonymousAuthorName } from "@/components/waves/drops/AnonymousDropAuthor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface NotificationHeaderProps {
  readonly author: ApiProfileMin;
  readonly children: React.ReactNode; // Content AFTER the user link (e.g. "replied • 2h")
  readonly actions?: React.ReactNode | undefined; // Follow button(s)
  readonly authorClassName?: string | undefined;
  readonly align?: "start" | "center";
}

export default function NotificationHeader({
  author,
  children,
  actions,
  authorClassName = "tw-text-sm",
  align = "start",
}: NotificationHeaderProps) {
  const { activeSrc, isPlaceholder, unoptimized, handleError } =
    useGatewayImageLoadState(author.is_anonymous ? null : author.pfp);
  const locale = useBrowserLocale();
  const authorIdentity = [author.handle, author.primary_address]
    .map((identifier) => identifier?.trim())
    .find((identifier): identifier is string => Boolean(identifier));
  let authorContent;
  if (author.is_anonymous) {
    authorContent = (
      <span className={`${authorClassName} tw-font-semibold`}>
        <AnonymousAuthorName />
      </span>
    );
  } else if (authorIdentity) {
    authorContent = (
      <UserProfileTooltipWrapper user={authorIdentity}>
        <Link
          href={`/${authorIdentity}`}
          prefetch={false}
          className={`${authorClassName} tw-max-w-full tw-rounded-sm tw-font-semibold tw-text-iron-50 tw-no-underline tw-underline-offset-4 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-underline`}
        >
          {authorIdentity}
        </Link>
      </UserProfileTooltipWrapper>
    );
  } else {
    authorContent = (
      <span className={`${authorClassName} tw-font-semibold tw-text-iron-400`}>
        {t(locale, "notifications.unknownProfile")}
      </span>
    );
  }

  return (
    <div
      className={`tw-flex tw-gap-x-3 ${align === "center" ? "tw-items-center" : "tw-items-start"}`}
    >
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
        <div className="tw-flex tw-min-w-[min(100%,16rem)] tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-leading-6 [overflow-wrap:anywhere]">
          {authorContent}
          {children}
        </div>
        {Boolean(actions) && !author.is_anonymous && (
          <div className="tw-max-w-full tw-flex-none">{actions}</div>
        )}
      </div>
    </div>
  );
}
