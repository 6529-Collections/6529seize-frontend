import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";

const titleClassName =
  "tw-block tw-mb-0 tw-max-w-full tw-break-words tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-50";

export default function GroupCardHeader({
  href,
  detailsId,
}: {
  readonly href?: string | undefined;
  readonly detailsId: string;
}) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const title = t(locale, "titleContext.routes.network");

  const onLinkKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (href && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      router.push(href);
    }
  };

  return (
    <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-3">
      <div className="tw-min-w-0 tw-flex-1">
        {href ? (
          <Link
            href={href}
            onKeyDown={onLinkKeyDown}
            aria-describedby={detailsId}
            className={`${titleClassName} tw-no-underline tw-transition tw-duration-200 tw-ease-out after:tw-absolute after:tw-inset-0 after:tw-z-20 after:tw-rounded-xl after:tw-content-[''] focus-visible:tw-outline-none focus-visible:after:tw-ring-2 focus-visible:after:tw-ring-inset focus-visible:after:tw-ring-primary-500 desktop-hover:hover:tw-text-iron-300`}
            title={title}
          >
            {title}
          </Link>
        ) : (
          <span className={titleClassName} title={title}>
            {title}
          </span>
        )}
      </div>
    </div>
  );
}
