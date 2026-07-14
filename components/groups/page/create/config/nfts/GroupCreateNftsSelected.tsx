import {
  type ApiGroupOwnsNft,
  ApiGroupOwnsNftNameEnum,
} from "@/generated/models/ApiGroupOwnsNft";
import { ApiGroupNftOwnershipMatchMode } from "@/generated/models/ApiGroupNftOwnershipMatchMode";
import {
  getGroupNftOwnershipCollectionLabel,
  getGroupNftOwnershipMatchMode,
  getGroupNftOwnershipMatchModeLabel,
} from "@/helpers/groups/group-nft-ownership";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import GroupCreateNftsSelectedItem from "./GroupCreateNftsSelectedItem";

const MATCH_MODE_OPTIONS = [
  ApiGroupNftOwnershipMatchMode.AnyToken,
  ApiGroupNftOwnershipMatchMode.AllTokens,
] as const;

export default function GroupCreateNftsSelected({
  selected,
  onRemove,
  onMatchModeChange,
}: {
  readonly selected: ApiGroupOwnsNft[];
  readonly onRemove: ({
    name,
    token,
  }: {
    name: ApiGroupOwnsNftNameEnum;
    token: string;
  }) => void;
  readonly onMatchModeChange: ({
    name,
    matchMode,
  }: {
    name: ApiGroupOwnsNftNameEnum;
    matchMode: ApiGroupNftOwnershipMatchMode;
  }) => void;
}) {
  const selectedSpecificTokens = selected.filter(
    (group) => group.tokens.length > 0
  );

  if (!selectedSpecificTokens.length) {
    return null;
  }

  return (
    <div className="tw-mt-4 tw-space-y-4">
      {selectedSpecificTokens.map((group) => {
        const matchMode = getGroupNftOwnershipMatchMode(group);
        const groupLabel = getGroupNftOwnershipCollectionLabel(group.name);
        return (
          <div
            key={group.name}
            className="tw-border-0 tw-border-t tw-border-solid tw-border-white/5 tw-pt-3"
          >
            <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
              <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                {t(DEFAULT_LOCALE, "groups.nftOwnership.requirementLabel", {
                  collection: groupLabel,
                })}
              </span>
              <div
                role="group"
                aria-label={t(
                  DEFAULT_LOCALE,
                  "groups.nftOwnership.tokenRequirementLabel",
                  {
                    collection: groupLabel,
                  }
                )}
                className="tw-flex tw-flex-wrap tw-gap-2"
              >
                {MATCH_MODE_OPTIONS.map((option) => {
                  const isActive = matchMode === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        onMatchModeChange({
                          name: group.name,
                          matchMode: option,
                        })
                      }
                      className={`tw-rounded-md tw-border tw-border-solid tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-outline-none tw-transition tw-duration-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                        isActive
                          ? "tw-border-primary-400 tw-bg-primary-400/20 tw-text-primary-300"
                          : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900"
                      }`}
                    >
                      {getGroupNftOwnershipMatchModeLabel(option)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
              {group.tokens.map((token) => (
                <GroupCreateNftsSelectedItem
                  key={`${group.name}-${token}`}
                  nft={{ name: group.name, token }}
                  onRemove={() => onRemove({ name: group.name, token })}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
