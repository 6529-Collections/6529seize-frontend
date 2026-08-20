import {
  ShieldExclamationIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ActionButton } from "./CreateWaveInlineGroupButtons";

export default function CreateWaveInlineGroupActions({
  disabled,
  criteriaActive,
  searchActive,
  onReplaceCriteria,
  onUseExistingGroup,
}: {
  readonly disabled: boolean;
  readonly criteriaActive: boolean;
  readonly searchActive: boolean;
  readonly onReplaceCriteria: () => void;
  readonly onUseExistingGroup: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-1.5 lg:tw-justify-end">
      <ActionButton
        icon={
          <ShieldExclamationIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-flex-shrink-0"
          />
        }
        label={t(locale, "waves.create.groups.actions.replaceCriteria")}
        disabled={disabled}
        active={criteriaActive}
        isToggle={true}
        onClick={onReplaceCriteria}
      />
      <ActionButton
        icon={
          <UserGroupIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-flex-shrink-0"
          />
        }
        label={t(locale, "waves.create.groups.actions.chooseGroup")}
        disabled={disabled}
        active={searchActive}
        isToggle={true}
        onClick={onUseExistingGroup}
      />
    </div>
  );
}
