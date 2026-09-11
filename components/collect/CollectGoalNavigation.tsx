import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ChartBarIcon,
  RectangleStackIcon,
  BarsArrowDownIcon,
} from "@heroicons/react/24/outline";
import type { CollectCollection, CollectIntent } from "./collect.types";

const SET_INTENTS: readonly CollectIntent[] = [
  "season",
  "full_set",
  "artist",
  "pebbles_set",
];

export function getCollectIntentOptions(
  intent: CollectIntent
): readonly CollectIntent[] {
  return SET_INTENTS.includes(intent) ? SET_INTENTS : [];
}

interface CollectGoalNavigationProps {
  readonly intent: CollectIntent;
  readonly collection: CollectCollection;
  readonly locale: SupportedLocale;
  readonly onIntentChange: (intent: CollectIntent) => void;
}

export default function CollectGoalNavigation({
  intent,
  collection,
  locale,
  onIntentChange,
}: CollectGoalNavigationProps) {
  const groups = [
    {
      id: "sets",
      label: "collect.navigation.completeSet",
      Icon: RectangleStackIcon,
      selected: SET_INTENTS.includes(intent),
      defaultIntent: collection === "pebbles" ? "pebbles_set" : "full_set",
    },
    {
      id: "lowest",
      label: "collect.navigation.lowest",
      Icon: BarsArrowDownIcon,
      selected: intent === "lowest",
      defaultIntent: "lowest",
    },
    {
      id: "tdh",
      label: "collect.navigation.tdh",
      Icon: ChartBarIcon,
      selected: intent === "tdh",
      defaultIntent: "tdh",
    },
  ] as const;

  return (
    <div
      role="group"
      aria-label={t(locale, "collect.navigation.label")}
      className="tw-mb-5 tw-flex tw-flex-wrap tw-gap-2"
    >
      {groups.map(({ id, label, Icon, selected, defaultIntent }) => (
        <button
          key={id}
          type="button"
          aria-pressed={selected}
          className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-border-b-2 tw-border-solid tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
            selected
              ? "tw-border-iron-300 tw-text-iron-100"
              : "tw-border-transparent tw-text-iron-400 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-text-iron-100"
          }`}
          onClick={() => {
            if (!selected) onIntentChange(defaultIntent);
          }}
        >
          <Icon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
          <span className="tw-whitespace-normal tw-text-left">
            {t(locale, label)}
          </span>
        </button>
      ))}
    </div>
  );
}
