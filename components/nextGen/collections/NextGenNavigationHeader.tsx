"use client";

import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import { NextgenView } from "@/types/enums";
import Image from "next/image";
import Link from "next/link";

const NEXTGEN_VIEWS: ReadonlyArray<{
  readonly href: string;
  readonly label: string;
  readonly view: NextgenView | undefined;
}> = [
  { href: "/nextgen", label: "Featured", view: undefined },
  {
    href: "/nextgen/collections",
    label: NextgenView.COLLECTIONS,
    view: NextgenView.COLLECTIONS,
  },
  {
    href: "/nextgen/artists",
    label: NextgenView.ARTISTS,
    view: NextgenView.ARTISTS,
  },
  {
    href: "/nextgen/about",
    label: NextgenView.ABOUT,
    view: NextgenView.ABOUT,
  },
];

export default function NextGenNavigationHeader(
  props: Readonly<{
    view?: NextgenView | undefined;
    setView?: ((view: NextgenView | undefined) => void) | undefined;
  }>
) {
  const handleNavigation = (
    event: { preventDefault(): void },
    view: NextgenView | undefined
  ) => {
    if (!props.setView) {
      return;
    }

    event.preventDefault();
    if (props.view === view) {
      return;
    }

    props.setView(view);
  };

  return (
    <header className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-py-5 md:tw-px-6 md:tw-py-6 lg:tw-px-8">
      <div className="tw-flex tw-flex-col tw-gap-4 min-[1200px]:tw-flex-row min-[1200px]:tw-items-center min-[1200px]:tw-justify-between">
        <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 sm:tw-w-auto sm:tw-justify-start">
          <div className="tw-min-w-0 min-[1200px]:tw-hidden">
            <CollectionsDropdown
              activePage="nextgen"
              variant="brand"
              triggerContent={
                <Image
                  unoptimized
                  width={696}
                  height={91}
                  className="tw-h-auto tw-w-[140px] tw-max-w-[38vw] sm:tw-w-[250px] sm:tw-max-w-[85vw]"
                  src="/nextgen-logo.png"
                  alt="NextGen"
                />
              }
            />
          </div>
          <Link
            href="/nextgen"
            scroll={false}
            onNavigate={(event) => handleNavigation(event, undefined)}
            aria-label="NextGen featured"
            className="tw-hidden tw-rounded-md focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 min-[1200px]:tw-block"
          >
            <Image
              unoptimized
              priority
              width={696}
              height={91}
              className="tw-h-auto tw-w-[250px]"
              src="/nextgen-logo.png"
              alt="NextGen"
            />
          </Link>
          <div className="tw-shrink-0">
            <LFGButton contract="nextgen" />
          </div>
        </div>

        <nav
          aria-label="NextGen sections"
          className="tw-w-full tw-overflow-x-auto min-[1200px]:tw-w-auto"
        >
          <ul className="tw-m-0 tw-flex tw-min-w-max tw-list-none tw-gap-1 tw-rounded-lg tw-bg-iron-900 tw-p-1 tw-ring-1 tw-ring-inset tw-ring-white/10">
            {NEXTGEN_VIEWS.map((item) => {
              const isActive =
                Boolean(props.setView) && props.view === item.view;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    scroll={false}
                    onNavigate={(event) => handleNavigation(event, item.view)}
                    aria-current={isActive ? "page" : undefined}
                    className={`tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-no-underline tw-transition tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 sm:tw-px-4 ${
                      isActive
                        ? "tw-bg-iron-700 tw-text-white tw-shadow-sm"
                        : "tw-text-iron-300 hover:tw-bg-iron-800 hover:tw-text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
