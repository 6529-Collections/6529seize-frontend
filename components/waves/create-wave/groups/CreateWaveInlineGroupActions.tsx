import {
  ArrowPathIcon,
  GlobeAltIcon,
  PencilIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ActionButton } from "./CreateWaveInlineGroupButtons";

export default function CreateWaveInlineGroupActions({
  disabled,
  criteriaDisabled = false,
  criteriaActive,
  searchActive,
  showChooseGroup = true,
  isWaveAccessEditor = false,
  showMakeWavePublic = false,
  onMakeWavePublic,
  showMatchWaveAccess = false,
  onMatchWaveAccess,
  onReplaceCriteria,
  onUseExistingGroup,
}: {
  readonly disabled: boolean;
  readonly criteriaDisabled?: boolean | undefined;
  readonly criteriaActive: boolean;
  readonly searchActive: boolean;
  readonly showChooseGroup?: boolean;
  readonly isWaveAccessEditor?: boolean;
  readonly showMakeWavePublic?: boolean;
  readonly onMakeWavePublic?: (() => void) | undefined;
  readonly showMatchWaveAccess?: boolean;
  readonly onMatchWaveAccess?: (() => void) | undefined;
  readonly onReplaceCriteria: () => void;
  readonly onUseExistingGroup: () => void;
}) {
  const locale = useBrowserLocale();
  const isCancel = isWaveAccessEditor && criteriaActive;
  let criteriaIcon = (
    <PencilIcon aria-hidden="true" className="tw-size-3.5 tw-flex-shrink-0" />
  );
  let criteriaLabel = t(locale, "waves.create.groups.actions.edit");
  if (!isWaveAccessEditor) {
    criteriaIcon = (
      <ShieldExclamationIcon
        aria-hidden="true"
        className="tw-size-3.5 tw-flex-shrink-0"
      />
    );
    criteriaLabel = t(locale, "waves.create.groups.actions.editCriteria");
  } else if (isCancel) {
    criteriaIcon = (
      <XMarkIcon aria-hidden="true" className="tw-size-3.5 tw-flex-shrink-0" />
    );
    criteriaLabel = t(locale, "waves.create.actions.cancel");
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-gap-1.5 lg:tw-justify-end">
      {showMakeWavePublic && onMakeWavePublic ? (
        <ActionButton
          icon={
            <GlobeAltIcon
              aria-hidden="true"
              className="tw-size-3.5 tw-flex-shrink-0"
            />
          }
          label={t(locale, "waves.create.groups.editAccess.makePublic")}
          disabled={disabled}
          onClick={onMakeWavePublic}
        />
      ) : null}
      {showMatchWaveAccess && onMatchWaveAccess ? (
        <ActionButton
          icon={
            <ArrowPathIcon
              aria-hidden="true"
              className="tw-size-3.5 tw-flex-shrink-0"
            />
          }
          label={t(locale, "waves.create.groups.actions.matchWaveAccess")}
          disabled={disabled}
          onClick={onMatchWaveAccess}
        />
      ) : null}
      <ActionButton
        icon={criteriaIcon}
        label={criteriaLabel}
        disabled={disabled || criteriaDisabled}
        active={criteriaActive}
        isToggle={true}
        onClick={onReplaceCriteria}
      />
      {showChooseGroup ? (
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
      ) : null}
    </div>
  );
}
