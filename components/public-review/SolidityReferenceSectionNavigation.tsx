"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const REFERENCE_SECTIONS = [
  {
    id: "solidity-generation-provenance",
    labelKey: "publicReview.reference.generatedLabel",
  },
  {
    id: "solidity-auditor-evidence",
    labelKey: "publicReview.reference.auditorEvidence",
  },
  {
    id: "solidity-release-readiness",
    labelKey: "publicReview.reference.releaseReadiness",
  },
  {
    id: "solidity-risk-register",
    labelKey: "publicReview.reference.riskRegister",
  },
  {
    id: "solidity-governed-parameters",
    labelKey: "publicReview.reference.governedParameters",
  },
  {
    id: "solidity-natspec-gaps",
    labelKey: "publicReview.reference.natSpecGaps",
  },
  {
    id: "solidity-global-declarations",
    labelKey: "publicReview.reference.globalDeclarations",
  },
  {
    id: "solidity-definition-inventory",
    labelKey: "publicReview.reference.definitions",
  },
] as const;

type SolidityReferenceSectionId = (typeof REFERENCE_SECTIONS)[number]["id"];

type SolidityReferencePanels = Readonly<
  Record<SolidityReferenceSectionId, ReactNode>
>;

const TAB_CLASSES =
  "tw-m-0 tw-flex tw-min-h-11 tw-items-center tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-1.5 tw-pb-3 tw-pt-2.5 tw-text-sm tw-font-medium tw-leading-5 tw-transition-colors tw-duration-150 tw-ease-out motion-reduce:tw-transition-none focus:tw-outline-none focus-visible:tw-rounded-sm focus-visible:tw-bg-white/10";

function getSectionFromHash(hash: string): SolidityReferenceSectionId {
  const sectionId = hash.startsWith("#") ? hash.slice(1) : hash;
  return (
    REFERENCE_SECTIONS.find((section) => section.id === sectionId)?.id ??
    REFERENCE_SECTIONS[0].id
  );
}

function subscribeToLocationHash(onStoreChange: () => void) {
  globalThis.addEventListener("hashchange", onStoreChange);
  globalThis.addEventListener("popstate", onStoreChange);
  return () => {
    globalThis.removeEventListener("hashchange", onStoreChange);
    globalThis.removeEventListener("popstate", onStoreChange);
  };
}

function getLocationHash() {
  return globalThis.location.hash;
}

function getServerLocationHash() {
  return "";
}

export function SolidityReferenceSectionNavigation({
  panels,
}: {
  readonly panels: SolidityReferencePanels;
}) {
  const tabsId = useId();
  const locationHash = useSyncExternalStore(
    subscribeToLocationHash,
    getLocationHash,
    getServerLocationHash
  );
  const activeSection = getSectionFromHash(locationHash);
  const tabRefs = useRef<
    Partial<Record<SolidityReferenceSectionId, HTMLButtonElement | null>>
  >({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const skipNextHashScrollRef = useRef(false);

  const updateScrollControls = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const { clientWidth, scrollLeft, scrollWidth } = container;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    updateScrollControls();
    container.addEventListener("scroll", updateScrollControls, {
      passive: true,
    });
    globalThis.addEventListener("resize", updateScrollControls);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateScrollControls);
    resizeObserver?.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollControls);
      globalThis.removeEventListener("resize", updateScrollControls);
      resizeObserver?.disconnect();
    };
  }, [updateScrollControls]);

  useEffect(() => {
    if (locationHash !== `#${activeSection}`) {
      return;
    }
    if (skipNextHashScrollRef.current) {
      skipNextHashScrollRef.current = false;
      return;
    }
    const section = document.getElementById(activeSection);
    const animationFrame = requestAnimationFrame(() => {
      section?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [activeSection, locationHash]);

  const selectSection = (sectionId: SolidityReferenceSectionId) => {
    if (globalThis.location.hash === `#${sectionId}`) {
      return;
    }
    skipNextHashScrollRef.current = true;
    const nextUrl = new URL(globalThis.location.href);
    nextUrl.hash = sectionId;
    globalThis.history.pushState(globalThis.history.state, "", nextUrl);
    globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  const activateTab = (index: number) => {
    const section =
      REFERENCE_SECTIONS[
        (index + REFERENCE_SECTIONS.length) % REFERENCE_SECTIONS.length
      ];
    if (!section) {
      return;
    }
    selectSection(section.id);
    const tab = tabRefs.current[section.id];
    tab?.focus();
    tab?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        activateTab(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        activateTab(index - 1);
        break;
      case "Home":
        event.preventDefault();
        activateTab(0);
        break;
      case "End":
        event.preventDefault();
        activateTab(REFERENCE_SECTIONS.length - 1);
        break;
      default:
        break;
    }
  };

  const scrollTabs = (direction: -1 | 1) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollBy({
      behavior: "smooth",
      left: direction * Math.min(320, container.clientWidth * 0.7),
    });
  };

  const activeTabId = `${tabsId}-${activeSection}-tab`;
  const panelId = `${tabsId}-panel`;

  return (
    <div>
      <div className="tw-relative tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800">
        <div
          className="tw-no-scrollbar tw-w-full tw-overflow-x-auto tw-overflow-y-hidden tw-overscroll-x-contain tw-scroll-smooth [touch-action:pan-x]"
          ref={scrollContainerRef}
        >
          <div
            aria-label={t(DEFAULT_LOCALE, "publicReview.navigation.onThisPage")}
            className="-tw-mb-px tw-flex tw-min-w-max tw-gap-x-3"
            role="tablist"
          >
            {REFERENCE_SECTIONS.map((section, index) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  aria-controls={panelId}
                  aria-selected={isActive}
                  className={`${TAB_CLASSES} ${
                    isActive
                      ? "tw-cursor-default tw-border-primary-400 tw-text-iron-100"
                      : "tw-cursor-pointer tw-border-transparent tw-text-iron-400 hover:tw-border-iron-500 hover:tw-text-iron-100"
                  }`}
                  id={`${tabsId}-${section.id}-tab`}
                  key={section.id}
                  onClick={() => selectSection(section.id)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  ref={(element) => {
                    tabRefs.current[section.id] = element;
                  }}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                >
                  {t(DEFAULT_LOCALE, section.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
        {canScrollLeft ? (
          <>
            <div
              aria-hidden="true"
              className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-z-10 tw-w-16 tw-bg-gradient-to-r tw-from-[#0D0D0F] tw-via-[#0D0D0F]/90 tw-to-transparent"
            />
            <button
              aria-label={t(
                DEFAULT_LOCALE,
                "publicReview.reference.scrollSectionsLeft"
              )}
              className="tw-group tw-absolute tw-left-0 tw-top-1/2 tw-z-20 tw-inline-flex tw-size-10 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
              onClick={() => scrollTabs(-1)}
              type="button"
            >
              <ChevronLeftIcon
                aria-hidden="true"
                className="tw-size-4 tw-transition-colors group-hover:tw-text-iron-100"
              />
            </button>
          </>
        ) : null}
        {canScrollRight ? (
          <>
            <div
              aria-hidden="true"
              className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-z-10 tw-w-16 tw-bg-gradient-to-l tw-from-[#0D0D0F] tw-via-[#0D0D0F]/90 tw-to-transparent"
            />
            <button
              aria-label={t(
                DEFAULT_LOCALE,
                "publicReview.reference.scrollSectionsRight"
              )}
              className="tw-group tw-absolute tw-right-0 tw-top-1/2 tw-z-20 tw-inline-flex tw-size-10 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 focus-visible:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400"
              onClick={() => scrollTabs(1)}
              type="button"
            >
              <ChevronRightIcon
                aria-hidden="true"
                className="tw-size-4 tw-transition-colors group-hover:tw-text-iron-100"
              />
            </button>
          </>
        ) : null}
      </div>
      <div
        aria-labelledby={activeTabId}
        className="tw-min-w-0"
        id={panelId}
        role="tabpanel"
        tabIndex={0}
      >
        {panels[activeSection]}
      </div>
    </div>
  );
}
