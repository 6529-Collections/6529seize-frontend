"use client";

import Image from "next/image";
import { useState } from "react";
import { EX_FOCUS } from "../tokens";

/**
 * Pick a card (EXPLAINED.md §6.5): thumbnails as buttons, one pressed; a
 * card without art shows its number. Each button carries `data-card`.
 */
export interface PickableCard {
  readonly id: string;
  /** The thumbnail; null shows the number. */
  readonly thumb: string | null;
  /** "Meme #4": the button's name. */
  readonly name: string;
  /** "562": shown when there is no thumbnail. */
  readonly short: string;
}

export default function CardPicker({
  cards,
  value,
  onChange,
  label,
}: {
  readonly cards: readonly PickableCard[];
  readonly value: string;
  readonly onChange: (id: string) => void;
  /** The group's name: "Pick a card". */
  readonly label: string;
}) {
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  return (
    <div
      className="tw-mt-2.5 tw-flex tw-flex-wrap tw-gap-1 md:tw-gap-[5px]"
      role="group"
      aria-label={label}
    >
      {cards.map((card) => {
        const on = card.id === value;
        const thumb = card.thumb && !failed.has(card.id) ? card.thumb : null;
        return (
          <button
            key={card.id}
            type="button"
            aria-pressed={on}
            aria-label={card.name}
            data-card={card.id}
            onClick={() => onChange(card.id)}
            className={`tw-relative tw-h-11 tw-min-w-[31px] tw-cursor-pointer tw-overflow-hidden tw-rounded tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-0 tw-text-xs tw-font-semibold tw-text-iron-400 ${thumb ? "tw-w-[31px]" : "tw-px-1"} ${on ? "tw-outline tw-outline-2 tw-outline-offset-1 tw-outline-primary-400" : ""} ${EX_FOCUS}`}
          >
            {thumb ? (
              <Image
                src={thumb}
                alt=""
                fill
                sizes="31px"
                className="tw-object-cover"
                onError={() =>
                  setFailed((current) => new Set([...current, card.id]))
                }
              />
            ) : (
              card.short
            )}
          </button>
        );
      })}
    </div>
  );
}
