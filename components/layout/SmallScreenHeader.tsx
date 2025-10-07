"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";

interface SmallScreenHeaderProps {
  readonly onMenuToggle: () => void;
  readonly isMenuOpen: boolean;
}

export default function SmallScreenHeader({
  onMenuToggle,
  isMenuOpen,
}: SmallScreenHeaderProps) {
  return (
    <header className="tailwind-scope tw-flex-shrink-0 tw-bg-black tw-border-b tw-border-iron-900 tw-border-solid tw-border-x-0 tw-border-t-0">
      <div className="tw-flex tw-items-center tw-justify-between tw-h-16 tw-px-5">
        <Link href="/" className="tw-flex tw-items-center">
          <Image
            unoptimized
            loading="eager"
            priority
            alt="6529Seize"
            src="/6529.png"
            className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-transition-all tw-duration-100 hover:tw-scale-[1.02] hover:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.3)]"
            width={40}
            height={40}
          />
        </Link>
        <button
          onClick={onMenuToggle}
          className="tw-h-10 tw-w-10 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <Bars3Icon className="tw-h-5 tw-w-5 tw-text-iron-300 tw-flex-shrink-0" />
        </button>
      </div>
    </header>
  );
}
