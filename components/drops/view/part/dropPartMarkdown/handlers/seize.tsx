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

const getGroupId = (href: string): string | null => {
  const result = parseSeizeQueryLink(href, "/network", ["group"]);
  if (!result || typeof result.group !== "string") {
    return null;
  }

  return result.group;
};

const createSeizeGroupHandler = (): LinkHandler => ({
  match: (href) => Boolean(getGroupId(href)),
  render: (href) => {
    const groupId = getGroupId(href);
    if (!groupId) {
      throw new Error("Invalid seize group link");
    }

    return <GroupCardChat href={href} groupId={groupId} />;
  },
  display: "block",
});

const getWaveId = (href: string): string | null => {
  const result = parseSeizeQueryLink(href, "/my-stream", ["wave"], true);
  if (!result || typeof result.wave !== "string") {
    return null;
  }

  return result.wave;
};

const createSeizeWaveHandler = (): LinkHandler => ({
  match: (href) => Boolean(getWaveId(href)),
  render: (href) => {
    const waveId = getWaveId(href);
    if (!waveId) {
      throw new Error("Invalid seize wave link");
    }

    return <WaveItemChat href={href} waveId={waveId} />;
  },
  display: "block",
});

const getDropId = (href: string): string | null => {
  const result = parseSeizeQueryLink(href, "/my-stream", ["wave", "drop"], true);
  if (!result || typeof result.drop !== "string") {
    return null;
  }

  return result.drop;
};

const createSeizeDropHandler = (): LinkHandler => ({
  match: (href) => Boolean(getDropId(href)),
  render: (href) => {
    const dropId = getDropId(href);
    if (!dropId) {
      throw new Error("Invalid seize drop link");
    }

    return <DropItemChat href={href} dropId={dropId} />;
  },
  display: "block",
});

export const createSeizeHandlers = ({
  onQuoteClick,
}: CreateSeizeHandlersConfig): LinkHandler[] => [
  createSeizeQuoteHandler(onQuoteClick),
  createSeizeGroupHandler(),
  createSeizeWaveHandler(),
  createSeizeDropHandler(),
];

export type SeizeHandlers = ReturnType<typeof createSeizeHandlers>;
