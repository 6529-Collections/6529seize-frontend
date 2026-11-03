import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ChartBarIcon,
  Squares2X2Icon,
  BarsArrowDownIcon,
} from "@heroicons/react/24/outline";
import type { CollectCollection, CollectIntent } from "./collect.types";

const SET_INTENTS: readonly CollectIntent[] = [
  "season",
  "full_set",
  "artist",
  "pebbles_set",
];

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
      Icon: Squares2X2Icon,
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
      data-collect-navigation
      role="group"
      aria-label={t(locale, "collect.navigation.label")}
      className="-tw-mx-1 tw-mb-5 tw-flex tw-min-w-0 tw-scroll-px-1 tw-gap-1 tw-overflow-x-auto tw-px-1 tw-py-1 sm:tw-gap-2"
    >
      {groups.map(({ id, label, Icon, selected, defaultIntent }) => (
        <button
          key={id}
          type="button"
          aria-pressed={selected}
          className={`tw-inline-flex tw-min-h-11 tw-shrink-0 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-0 tw-border-b-2 tw-border-solid tw-bg-transparent tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-px-3 ${
            selected
              ? "tw-border-iron-300 tw-text-iron-100"
              : "tw-border-transparent tw-text-iron-400 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-text-iron-100"
          }`}
          onClick={() => {
            if (!selected) onIntentChange(defaultIntent);
          }}
          onFocus={(event) => {
            event.currentTarget.scrollIntoView({
              block: "nearest",
              inline: "nearest",
            });
          }}
        >
          <Icon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
          <span className="tw-whitespace-nowrap tw-text-left">
            {t(locale, label)}
          </span>
        </button>
      ))}
    </div>
  );
}
