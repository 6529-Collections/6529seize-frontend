import { InformationCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

/** The box the move-to-the-6529-Network notices share. */
export default function IdentityMoveCallout({
  label,
  text,
  testId,
  link,
  className = "",
}: {
  readonly label: string;
  readonly text: string;
  readonly testId: string;
  readonly link?: { readonly href: string; readonly label: string } | undefined;
  readonly className?: string;
}) {
  return (
    <section
      aria-label={label}
      data-testid={testId}
      className={`tailwind-scope tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-primary-400/30 tw-bg-primary-400/5 tw-px-4 tw-py-3 ${className}`.trim()}
    >
      <InformationCircleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-shrink-0 tw-text-primary-300"
      />
      <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
        {text}
        {link && (
          <>
            {" "}
            <Link
              href={link.href}
              className="tw-font-semibold tw-text-primary-300 hover:tw-text-primary-200"
            >
              {link.label}
            </Link>
          </>
        )}
      </p>
    </section>
  );
}
