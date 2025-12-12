"use client";

import { MemeSeason } from "@/entities/ISeason";
import { commonApiFetch } from "@/services/api/common-api";
import { useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import SeasonsGridDropdownItemsWrapper from "./SeasonsGridDropdownItemsWrapper";

interface SeasonsGridDropdownProps {
  readonly selected: MemeSeason | null;
  readonly setSelected: (season: MemeSeason | null) => void;
  readonly initialSeasonId?: number | null;
  readonly disabled?: boolean;
}

export default function SeasonsGridDropdown({
  selected,
  setSelected,
  initialSeasonId,
  disabled = false,
}: SeasonsGridDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [seasons, setSeasons] = useState<MemeSeason[]>([]);
  const [initialApplied, setInitialApplied] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
      signal: abortController.signal,
    })
      .then((response) => {
        setSeasons(response);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Failed to fetch meme seasons:", error);
      });
    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (seasons.length === 0) return;
    if (initialApplied) return;
    if (selected !== null) return;
    if (!initialSeasonId) return;
    const matchedSeason = seasons.find((s) => s.id === initialSeasonId);
    if (matchedSeason) {
      setSelected(matchedSeason);
      setInitialApplied(true);
    }
  }, [initialSeasonId, seasons, initialApplied, setSelected, selected]);

  useEffect(() => {
    if (!iconScope.current) return;
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  }, [animateIcon, iconScope, isOpen]);

  const getLabel = () => {
    if (selected === null) return "All Seasons";
    return selected.display;
  };

  const onSelect = (season: MemeSeason | null) => {
    setSelected(season);
    setIsOpen(false);
  };

  return (
    <div className="tailwind-scope tw-w-full tw-h-full">
      <div className="tw-relative tw-w-full">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          aria-label={`Season: ${getLabel()}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${
            disabled
              ? "tw-opacity-50 tw-text-iron-400"
              : "hover:tw-ring-iron-600 tw-text-iron-300"
          } tw-bg-iron-800 lg:tw-bg-iron-900 tw-py-3 tw-w-full tw-truncate tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-pl-3.5 tw-pr-10 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 
          focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-sm hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between`}>
          {getLabel()}
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
            <svg
              ref={iconScope}
              className="tw-h-5 tw-w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </div>
      <SeasonsGridDropdownItemsWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        buttonRef={buttonRef}
        filterLabel="Season">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`tw-col-span-full tw-w-full tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-md tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
            selected === null
              ? "tw-bg-primary-500/20 tw-border-primary-500 tw-text-primary-300"
              : "tw-bg-transparent tw-border-iron-700 tw-text-iron-200 hover:tw-bg-iron-800"
          }`}
          role="menuitem">
          <span>All Seasons</span>
        </button>
        {seasons.map((season) => (
          <button
            key={season.id}
            type="button"
            onClick={() => onSelect(season)}
            className={`tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-rounded-md tw-border tw-border-solid tw-px-2 tw-py-2 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
              selected?.id === season.id
                ? "tw-bg-primary-500/20 tw-border-primary-500 tw-text-primary-300"
                : "tw-bg-transparent tw-border-iron-700 tw-text-iron-200 hover:tw-bg-iron-800"
            }`}
            role="menuitem">
            <span>{season.display}</span>
          </button>
        ))}
      </SeasonsGridDropdownItemsWrapper>
    </div>
  );
}
