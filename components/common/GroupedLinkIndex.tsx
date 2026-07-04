import { ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";

export type GroupedLinkIndexItem = {
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly href: string;
};

export type GroupedLinkIndexGroup = {
  readonly id: string;
  readonly title: string;
  readonly items: readonly GroupedLinkIndexItem[];
};

export default function GroupedLinkIndex({
  eyebrow,
  title,
  groups,
  headingIdPrefix,
  getCardAriaLabel,
  showArrows = false,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly groups: readonly GroupedLinkIndexGroup[];
  readonly headingIdPrefix: string;
  readonly getCardAriaLabel: (label: string) => string;
  readonly showArrows?: boolean | undefined;
}) {
  return (
    <section className="tw-w-full tw-pb-10 tw-text-iron-100">
      <header className="tw-mb-8 tw-max-w-3xl">
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
          {eyebrow}
        </p>
        <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
          {title}
        </h1>
      </header>

      <div className="tw-grid tw-gap-7">
        {groups.map((group) => {
          const headingId = `${headingIdPrefix}-${group.id}`;

          return (
            <section key={group.id} aria-labelledby={headingId}>
              <h2
                id={headingId}
                className="tw-mb-3 tw-text-sm tw-font-semibold tw-uppercase tw-leading-5 tw-text-iron-400"
              >
                {group.title}
              </h2>
              <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
                {group.items.map((item) => {
                  const hasDescription = item.description !== undefined;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-label={getCardAriaLabel(item.label)}
                      className={clsx(
                        "tw-group tw-flex tw-h-full tw-min-h-20 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-p-4 !tw-no-underline tw-transition tw-duration-200 tw-ease-out hover:tw-border-[#24386F] hover:tw-bg-[#050B1E] focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black",
                        showArrows && "tw-gap-4",
                        hasDescription
                          ? "tw-flex-col tw-items-start"
                          : "tw-items-center"
                      )}
                    >
                      <span
                        className={clsx(
                          "tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 group-hover:tw-text-white",
                          showArrows && "tw-min-w-0 tw-flex-1"
                        )}
                      >
                        {item.label}
                      </span>
                      {hasDescription && (
                        <span className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400 group-hover:tw-text-iron-200">
                          {item.description}
                        </span>
                      )}
                      {showArrows && (
                        <ArrowRightIcon
                          aria-hidden="true"
                          className="tw-size-4 tw-flex-none tw-text-iron-500 tw-transition group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
