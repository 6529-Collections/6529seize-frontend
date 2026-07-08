"use client";

import { useState } from "react";
import { ArrowRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import {
  cx,
  GLASS_PANEL_CLASS,
  TERTIARY_ACTION_CLASS,
  TERTIARY_ACTION_LABEL_CLASS,
} from "./page.utils";

export interface FaqAccordionItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly learnMoreHref?: string;
  readonly learnMoreLabel: string;
}

export function FaqAccordion({
  items,
}: {
  readonly items: readonly FaqAccordionItem[];
}) {
  const [openIds, setOpenIds] = useState<readonly string[]>([]);

  const toggleItem = (id: string) => {
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((openId) => openId !== id)
        : [...current, id]
    );
  };

  return (
    <div className="tw-mx-auto tw-max-w-4xl tw-space-y-2">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const panelId = `join-6529-faq-${item.id}`;

        return (
          <article className={cx(GLASS_PANEL_CLASS, "tw-group")} key={item.id}>
            <button
              aria-controls={panelId}
              aria-expanded={isOpen}
              className="tw-flex tw-w-full tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-6 tw-py-5 tw-text-left tw-text-[15px] tw-font-medium tw-leading-6 tw-text-iron-300 tw-transition-colors group-hover:tw-text-iron-50 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30"
              onClick={() => toggleItem(item.id)}
              type="button"
            >
              <span>{item.question}</span>
              <PlusIcon
                aria-hidden="true"
                className={cx(
                  "tw-h-3 tw-w-3 tw-shrink-0 tw-transform-gpu tw-text-iron-600 tw-transition-transform tw-duration-300 tw-ease-out motion-reduce:tw-transition-none",
                  isOpen && "tw-rotate-45"
                )}
              />
            </button>
            <div
              aria-hidden={!isOpen}
              className={cx(
                "tw-grid tw-transition-[grid-template-rows,opacity] tw-duration-300 tw-ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:tw-transition-none",
                isOpen
                  ? "tw-grid-rows-[1fr] tw-opacity-100"
                  : "tw-grid-rows-[0fr] tw-opacity-0"
              )}
              id={panelId}
            >
              <div className="tw-min-h-0 tw-overflow-hidden">
                <div
                  className={cx(
                    "tw-transform-gpu tw-px-6 tw-pb-6 tw-text-[15px] tw-font-light tw-leading-6 tw-text-iron-500 tw-transition-transform tw-duration-300 tw-ease-out motion-reduce:tw-transition-none",
                    isOpen ? "tw-translate-y-0" : "-tw-translate-y-1"
                  )}
                >
                  <p className="tw-m-0">{item.answer}</p>
                  {item.learnMoreHref !== undefined && (
                    <Link
                      className={cx("tw-mt-2", TERTIARY_ACTION_CLASS)}
                      href={item.learnMoreHref}
                      tabIndex={isOpen ? undefined : -1}
                    >
                      <span className={TERTIARY_ACTION_LABEL_CLASS}>
                        {item.learnMoreLabel}
                      </span>
                      <ArrowRightIcon
                        aria-hidden="true"
                        className="tw-h-2.5 tw-w-2.5"
                      />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
