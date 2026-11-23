import { compareLocalized } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import type { OnchainMuseumSnapshot } from "@/lib/museum/onchain/museum";
import {
  buildOnchainMuseumView,
  type OnchainMuseumView,
} from "@/lib/museum/onchain/presentation";
import { onchainLabeler } from "./labels";

const views = new WeakMap<OnchainMuseumSnapshot, OnchainMuseumView>();

/** One view per verified snapshot; the snapshot is replaced on refresh. */
export function onchainMuseumView(
  snapshot: OnchainMuseumSnapshot
): OnchainMuseumView {
  let view = views.get(snapshot);
  if (view === undefined) {
    view = buildOnchainMuseumView(snapshot, {
      labeler: onchainLabeler,
      compare: (left, right) => compareLocalized(DEFAULT_LOCALE, left, right),
    });
    views.set(snapshot, view);
  }
  return view;
}
