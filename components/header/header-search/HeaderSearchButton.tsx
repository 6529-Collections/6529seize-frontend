"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useKey } from "react-use";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import CommonAnimationWrapper from "@/components/utils/animation/CommonAnimationWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import useDeviceInfo from "@/hooks/useDeviceInfo";

import HeaderSearchModal from "./HeaderSearchModal";



interface HeaderSearchButtonProps {
  readonly wave: ApiWave | null;
}

export default function HeaderSearchButton({ wave }: HeaderSearchButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const { isApp } = useDeviceInfo();

  useEffect(() => {
    let rafId: number | null = null;

    if (wasOpenRef.current && !isOpen) {
      rafId = window.requestAnimationFrame(() => {
        buttonRef.current?.focus({ preventScroll: true });
      });
    }

    wasOpenRef.current = isOpen;

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isOpen]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  useKey((event) => event.metaKey && event.key === "k", handleOpen, {
    event: "keydown",
  });

  const iconSizeClasses = isApp ? "tw-h-6 tw-w-6" : "tw-h-5 tw-w-5";

  return (
    <div className="tailwind-scope tw-self-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Search"
        title="Search"
        onClick={handleOpen}
        className={clsx(
          "tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-text-iron-300 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400",
          isApp
            ? "tw-bg-black"
            : "tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700"
        )}
      >
        <MagnifyingGlassIcon
          className={clsx("tw-flex-shrink-0", iconSizeClasses)}
        />
      </button>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <HeaderSearchModal onClose={handleClose} wave={wave} />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </div>
  );
}
