import { MemeSeason } from "@/entities/ISeason";
import { commonApiFetch } from "@/services/api/common-api";
import { useAnimate } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import styles from "./SeasonsDropdown.module.scss";

interface Props {
  selectedSeason: number;
  setSelectedSeason(season: number): void;
}

export default function SeasonsDropdown(props: Readonly<Props>) {
  const [seasons, setSeasons] = useState<MemeSeason[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commonApiFetch<MemeSeason[]>({
      endpoint: "new_memes_seasons",
    }).then((response) => {
      setSeasons(response);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  }, [isOpen, animateIcon, iconScope]);

  useClickAway(dropdownWrapperRef, (e) => {
    if (
      buttonRef.current &&
      e.target instanceof Node &&
      buttonRef.current.contains(e.target)
    ) {
      return;
    }
    setIsOpen(false);
  });

  useKeyPressEvent("Escape", () => setIsOpen(false));

  const updatePosition = useCallback(() => {
    if (!isOpen || !buttonRef.current || !dropdownWrapperRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = dropdownWrapperRef.current.offsetWidth || 400;
    const viewportWidth = window.innerWidth;
    const isSmallScreen = viewportWidth <= 576;

    let left: number;
    if (isSmallScreen) {
      left = buttonRect.left;
    } else {
      left = buttonRect.right - dropdownWidth;
    }

    const top = buttonRect.bottom + 8;

    dropdownWrapperRef.current.style.left = `${left}px`;
    dropdownWrapperRef.current.style.top = `${top}px`;
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(updatePosition);
      });
    }
  }, [isOpen, updatePosition]);

  const handleSeasonSelect = (seasonId: number) => {
    props.setSelectedSeason(seasonId);
    setIsOpen(false);
  };

  const displayText = props.selectedSeason === 0 ? "All" : props.selectedSeason;

  return (
    <div className="tw-w-full tw-h-full">
      <div className="tw-relative tw-w-full">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="true"
          aria-label={`Season: ${displayText}`}
          onClick={() => setIsOpen(!isOpen)}
          className={`hover:tw-ring-iron-600 tw-text-iron-300 tw-bg-iron-800 lg:tw-bg-iron-900 tw-py-3 tw-w-full tw-truncate tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-pl-3.5 tw-pr-10 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-sm hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-justify-between`}>
          SZN: {displayText}
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
        {isOpen && (
          <div
            className={`tw-fixed tw-z-[9999] ${styles.dropdownWrapper}`}
            ref={dropdownWrapperRef}>
            <div ref={gridRef} className={styles.seasonsGrid}>
              <button
                type="button"
                className={`${styles.seasonButton} ${styles.allButton} ${
                  props.selectedSeason === 0 ? styles.selected : ""
                }`}
                onClick={() => handleSeasonSelect(0)}>
                All
              </button>
              {seasons.map((season) => (
                <button
                  key={`season-${season.id}`}
                  type="button"
                  className={`${styles.seasonButton} ${
                    props.selectedSeason === season.id ? styles.selected : ""
                  }`}
                  onClick={() => handleSeasonSelect(season.id)}>
                  SZN{season.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
