import Link from "next/link";

export default function PrimaryButtonLink({
  href,
  children,
  padding = "tw-px-3.5 tw-py-2.5",
}: {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly padding?: string | undefined;
}) {
  return (
    <div className="tw-p-[1px] tw-w-full sm:tw-w-auto tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400 tw-to-primary-500">
      <Link
        href={href}
        className={`tw-no-underline tw-flex tw-w-full desktop-hover:hover:tw-text-white tw-gap-x-1.5 tw-items-center tw-justify-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 ${padding} tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-bg-primary-600 desktop-hover:hover:tw-border-primary-600`}
      >
        {children}
      </Link>
    </div>
  );
} 