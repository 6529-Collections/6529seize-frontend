import type { ReactElement } from "react";

import { ApiDrop } from "@/generated/models/ApiDrop";
import {
  parseSeizeQuoteLink,
  parseSeizeQueryLink,
  type SeizeQuoteLinkInfo,
} from "@/helpers/SeizeLinkParser";

import GroupCardChat from "@/components/groups/page/list/card/GroupCardChat";
import DropItemChat from "@/components/waves/drops/DropItemChat";
import WaveItemChat from "@/components/waves/list/WaveItemChat";
import type { LinkHandler } from "../linkTypes";
import { renderSeizeQuote } from "../renderers";

interface CreateSeizeHandlersConfig {
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

const ensureSeizeQuote = (href: string): SeizeQuoteLinkInfo => {
  const info = parseSeizeQuoteLink(href);
  if (!info) {
    throw new Error("Invalid seize quote link");
  }

  return info;
};

const createSeizeQuoteHandler = (
  onQuoteClick: (drop: ApiDrop) => void
): LinkHandler => ({
  match: (href) => Boolean(parseSeizeQuoteLink(href)),
  render: (href) => {
    const content = renderSeizeQuote(ensureSeizeQuote(href), onQuoteClick, href);
    if (!content) {
      throw new Error("Unable to render seize quote link");
    }

    return content;
  },
  display: "block",
});

const createSeizeQueryHandler = <T,>(
  extract: (href: string) => T | null,
  onMissing: string,
  render: (value: T, href: string) => ReactElement
): LinkHandler => ({
  match: (href) => Boolean(extract(href)),
  render: (href) => {
    const value = extract(href);
    if (!value) {
      throw new Error(onMissing);
    }

    return render(value, href);
  },
  display: "block",
});

const getGroupId = (href: string): string | null => {
  const result = parseSeizeQueryLink(href, "/network", ["group"]);
  if (!result || typeof result.group !== "string") {
    return null;
  }

  return result.group;
};

const createSeizeGroupHandler = (): LinkHandler =>
  createSeizeQueryHandler(
    getGroupId,
    "Invalid seize group link",
    (groupId, href) => <GroupCardChat href={href} groupId={groupId} />
  );

const getWaveId = (href: string): string | null => {
  const result = parseSeizeQueryLink(href, "/waves", ["wave"], true);
  if (!result || typeof result.wave !== "string") {
    return null;
  }

  return result.wave;
};

const createSeizeWaveHandler = (): LinkHandler =>
  createSeizeQueryHandler(
    getWaveId,
    "Invalid seize wave link",
    (waveId, href) => <WaveItemChat href={href} waveId={waveId} />
  );

const getDropId = (href: string): string | null => {
  const result = parseSeizeQueryLink(href, "/waves", ["wave", "drop"], true);
  if (!result || typeof result.drop !== "string") {
    return null;
  }

  return result.drop;
};

const createSeizeDropHandler = (): LinkHandler =>
  createSeizeQueryHandler(
    getDropId,
    "Invalid seize drop link",
    (dropId, href) => <DropItemChat href={href} dropId={dropId} />
  );

export const createSeizeHandlers = ({
  onQuoteClick,
}: CreateSeizeHandlersConfig): LinkHandler[] => [
  createSeizeQuoteHandler(onQuoteClick),
  createSeizeGroupHandler(),
  createSeizeWaveHandler(),
  createSeizeDropHandler(),
];

export type SeizeHandlers = ReturnType<typeof createSeizeHandlers>;
