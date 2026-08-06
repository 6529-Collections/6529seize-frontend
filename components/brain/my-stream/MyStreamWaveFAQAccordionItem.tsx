import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import type { ComponentType, SVGProps } from "react";

export interface WaveFaqSection<TId extends string = string> {
  readonly id: TId;
  readonly title: string;
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly Content: ComponentType;
}

interface MyStreamWaveFAQAccordionItemProps {
  readonly section: WaveFaqSection;
  readonly sectionRef: (element: HTMLElement | null) => void;
  readonly isOpen: boolean;
  readonly shouldReduceMotion: boolean;
  readonly onToggle: () => void;
}

const FAQ_ALIGNMENT_GRID_CLASS_NAME =
  "tw-grid tw-grid-cols-[1.25rem_minmax(0,1fr)_1.25rem] tw-gap-x-3";

const FAQ_PANEL_ANIMATION_SECONDS = 0.32;

const FAQ_PANEL_TRANSITION = {
  height: {
    duration: FAQ_PANEL_ANIMATION_SECONDS,
    ease: [0.22, 1, 0.36, 1],
  },
  opacity: { duration: 0.18, ease: "easeOut" },
  y: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
} as const;

function cx(...classes: ReadonlyArray<string | false | null | undefined>) {
  return classes
    .filter((className): className is string => Boolean(className))
    .join(" ");
}

export default function MyStreamWaveFAQAccordionItem({
  section,
  sectionRef,
  isOpen,
  shouldReduceMotion,
  onToggle,
}: MyStreamWaveFAQAccordionItemProps) {
  const panelId = useId();
  const buttonId = `${panelId}-button`;
  const { Content, Icon } = section;

  return (
    <section
      ref={sectionRef}
      className={cx(
        "tw-group tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none",
        isOpen
          ? "tw-border-primary-500/40 tw-bg-iron-900/90 tw-shadow-[inset_3px_0_0_rgba(59,130,246,0.75)]"
          : "tw-border-white/[0.06] tw-bg-iron-950/40 desktop-hover:hover:tw-border-white/10 desktop-hover:hover:tw-bg-iron-900/60"
      )}
    >
      <h3 className="tw-mb-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          onClick={onToggle}
          className={cx(
            FAQ_ALIGNMENT_GRID_CLASS_NAME,
            "tw-min-h-12 tw-w-full tw-cursor-pointer tw-items-center tw-border-0 tw-bg-transparent tw-px-4 tw-py-3 tw-text-left tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400/80 motion-reduce:tw-transition-none sm:tw-px-5 sm:tw-py-4 md:tw-py-3.5"
          )}
        >
          <span
            className={cx(
              "tw-flex tw-size-5 tw-items-center tw-justify-center tw-text-iron-400 tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none",
              isOpen
                ? "tw-text-primary-300"
                : "desktop-hover:group-hover:tw-text-iron-50"
            )}
          >
            <Icon className="tw-size-5" aria-hidden="true" />
          </span>
          <span className="tw-min-w-0 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-50 md:tw-text-base">
            {section.title}
          </span>
          <ChevronDownIcon
            className={cx(
              "tw-size-5 tw-text-iron-600 tw-transition-all tw-duration-300 motion-reduce:tw-transition-none",
              isOpen && "tw-rotate-180 tw-text-iron-50"
            )}
            aria-hidden="true"
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -2 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : FAQ_PANEL_TRANSITION
            }
            className="tw-overflow-hidden"
          >
            <div
              className={cx(
                FAQ_ALIGNMENT_GRID_CLASS_NAME,
                "tw-px-4 tw-pb-5 tw-text-sm tw-leading-6 tw-text-iron-300 sm:tw-px-5 sm:tw-pb-6"
              )}
            >
              <div className="tw-col-start-2 tw-col-end-4">
                <Content />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
