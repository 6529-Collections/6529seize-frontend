import Link from "next/link";

const titleClassName =
  "tw-block tw-mb-0 tw-max-w-full tw-line-clamp-2 tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-50";

export default function GroupCardHeader({
  title,
  href,
}: {
  readonly title: string;
  readonly href?: string | undefined;
}) {
  return (
    <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-3">
      <div className="tw-min-w-0 tw-flex-1">
        {href ? (
          <Link
            href={href}
            tabIndex={-1}
            className={`${titleClassName} tw-relative tw-z-30 tw-no-underline tw-transition tw-duration-200 tw-ease-out desktop-hover:hover:tw-text-iron-300`}
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
