"use client";

import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import { Bars3Icon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

interface SmallScreenHeaderProps {
  readonly onMenuToggle: () => void;
  readonly isMenuOpen: boolean;
}

export default function SmallScreenHeader({
  onMenuToggle,
  isMenuOpen,
}: SmallScreenHeaderProps) {
  return (
    <header className="tailwind-scope tw-sticky tw-top-0 tw-z-50 tw-flex-shrink-0 tw-bg-black tw-border-b tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div className="tw-flex tw-items-center tw-justify-between tw-h-16 tw-px-5">
        <Link href="/" className="tw-flex tw-items-center">
          <Image
            unoptimized
            loading="eager"
            priority
            alt="6529Seize"
            src="/6529.svg"
            className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-transition-all tw-duration-100 desktop-hover:hover:tw-scale-[1.02] desktop-hover:hover:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.3)]"
            width={40}
            height={40}
          />
        </Link>
        <div className="tw-flex tw-items-center tw-gap-3">
          <HeaderSearchButton />
          <button
            onClick={onMenuToggle}
            className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-h-10 tw-w-10 tw-border-0 tw-text-iron-300 desktop-hover:hover:tw-text-iron-50 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 desktop-hover:hover:tw-bg-iron-700"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
            <Bars3Icon className="tw-h-5 tw-w-5 tw-text-iron-300 tw-flex-shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
}
