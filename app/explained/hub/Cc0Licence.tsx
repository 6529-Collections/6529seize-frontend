"use client";

import { useState } from "react";
import Lens, { Readout } from "@/components/explained/lens/Lens";
import { Seg } from "@/components/explained/lens/controls";
import StampLine from "@/components/explained/marks/StampLine";
import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";

type HubKey =
  Extract<
    MessageKey,
    `explained.hub.${string}`
  > extends `explained.hub.${infer K}`
    ? K
    : never;

/** The hub's copy, read without the server's rich-text helper. */
function ht(locale: SupportedLocale, key: HubKey): string {
  return fill(locale, `explained.hub.${key}` as MessageKey);
}

/**
 * Where can this image go? (the mockup's licence model, memes-cc0.html):
 * pick a work and a use, and the answer names the rule behind it, from
 * 6529.io's license page. A 6529 Gradient is the case where CC0 stops, so
 * the lens turns rose for it.
 */
type Work = "meme" | "one" | "grad";
type Use = "sell" | "remix" | "ad";

function verdict(work: Work, use: Use): { big: HubKey; say: HubKey[] } {
  if (work === "grad") {
    return {
      big: use === "remix" ? "cc0.model.gradRemix" : "cc0.model.no",
      say: ["cc0.model.gradSay"],
    };
  }
  if (work === "one") {
    return { big: "cc0.model.yesBut", say: ["cc0.model.oneSay"] };
  }
  return {
    big: "cc0.model.yes",
    say:
      use === "ad"
        ? ["cc0.model.memeSay", "cc0.model.adSay"]
        : ["cc0.model.memeSay"],
  };
}

export default function Cc0Licence({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const [work, setWork] = useState<Work>("meme");
  const [use, setUse] = useState<Use>("sell");
  const answer = verdict(work, use);
  return (
    <Lens
      id="licence"
      label={ht(locale, "cc0.model.label")}
      question={ht(locale, "cc0.model.q")}
      broken={work === "grad"}
      locale={locale}
      stage={
        <div className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-flex tw-flex-col tw-gap-2">
            <span className="tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-iron-400">
              {ht(locale, "cc0.model.work")}
            </span>
            <Seg<Work>
              label={ht(locale, "cc0.model.work")}
              options={[
                { value: "meme", label: ht(locale, "cc0.model.meme") },
                { value: "one", label: ht(locale, "cc0.model.one") },
                { value: "grad", label: ht(locale, "cc0.model.grad") },
              ]}
              value={work}
              onChange={setWork}
              attr="work"
            />
          </div>
          <div className="tw-flex tw-flex-col tw-gap-2">
            <span className="tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-iron-400">
              {ht(locale, "cc0.model.use")}
            </span>
            <Seg<Use>
              label={ht(locale, "cc0.model.use")}
              options={[
                { value: "sell", label: ht(locale, "cc0.model.sell") },
                { value: "remix", label: ht(locale, "cc0.model.remix") },
                { value: "ad", label: ht(locale, "cc0.model.ad") },
              ]}
              value={use}
              onChange={setUse}
              attr="use"
            />
          </div>
        </div>
      }
      readout={
        <Readout
          big={ht(locale, answer.big)}
          say={answer.say.map((key) => ht(locale, key)).join(" ")}
        />
      }
      stamp={
        <span className="tw-flex tw-flex-col tw-items-start tw-gap-1.5 md:tw-flex-row md:tw-items-center md:tw-gap-4">
          <span className="tw-max-w-[520px] tw-text-[13px] tw-leading-5 tw-text-iron-400">
            {ht(locale, "cc0.model.leaves")}
          </span>
          <StampLine
            locale={locale}
            marks={[{ kind: "absolute", refText: "D89" }]}
          />
        </span>
      }
    />
  );
}
