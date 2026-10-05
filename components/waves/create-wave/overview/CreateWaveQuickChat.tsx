import type { ComponentProps } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { CreateWaveStep } from "@/types/waves.types";
import CreateWaveStepContent from "../CreateWaveStepContent";
import CreateWaveAdvancedSection from "../utils/CreateWaveAdvancedSection";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";
import CreateWaveNameInput from "./CreateWaveNameInput";
import CreateWaveImageInput from "./CreateWaveImageInput";
import CreateWaveType from "./type/CreateWaveType";

type Props = ComponentProps<typeof CreateWaveStepContent>;

export function CreateWaveQuickChatHeader({
  controller,
  overviewLeading,
}: Props) {
  const locale = useBrowserLocale();
  const { config, errors, setOverview } = controller;
  return (
    <div className="tw-mb-6 tw-space-y-6">
      {overviewLeading}
      <CreateWaveStepHeader
        title={t(locale, "waves.create.quick.title")}
        description={t(locale, "waves.create.quick.description")}
      />
      <CreateWaveNameInput
        name={config.overview.name}
        errors={errors}
        onChange={({ value }) =>
          setOverview({ ...config.overview, name: value })
        }
      />
    </div>
  );
}

export function CreateWaveQuickChatOptions(props: Props) {
  const locale = useBrowserLocale();
  const { config, groupValidation, errors, setOverview } = props.controller;
  const isRestricted = config.groups.canView !== null;
  let permissionsKey: Parameters<typeof t>[1];
  if (isRestricted) {
    permissionsKey = config.groups.admin
      ? "waves.create.quick.restrictedGroupAdmins"
      : "waves.create.quick.restrictedCreatorAdmin";
  } else {
    permissionsKey = config.groups.admin
      ? "waves.create.quick.publicGroupAdmins"
      : "waves.create.quick.publicCreatorAdmin";
  }
  return (
    <div className="tw-mt-6 tw-space-y-4">
      <p className="tw-m-0 tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-200">
        {t(locale, permissionsKey)}
      </p>
      <CreateWaveAdvancedSection
        title={t(locale, "waves.create.quick.optional")}
        summary={t(locale, "waves.create.quick.optionalSummary")}
        isCustomized={
          isRestricted ||
          !!config.groups.canChat ||
          !!config.groups.admin ||
          !!config.overview.image ||
          !!config.display.customRules ||
          !config.chat.enabled ||
          !config.drops.adminCanDeleteDrops
        }
        hasError={
          groupValidation.unavailable || groupValidation.invalidRoles.length > 0
        }
      >
        <div className="tw-space-y-6">
          <CreateWaveStepContent
            {...props}
            stepOverride={CreateWaveStep.GROUPS}
          />
          <div className="tw-space-y-3">
            <h3 className="tw-text-sm tw-font-semibold tw-text-iron-100">
              {t(locale, "waves.create.overview.picture")}
            </h3>
            <CreateWaveImageInput
              imageToShow={config.overview.image}
              setFile={(image) => setOverview({ ...config.overview, image })}
            />
          </div>
          <CreateWaveStepContent
            {...props}
            stepOverride={CreateWaveStep.RULES}
          />
        </div>
      </CreateWaveAdvancedSection>
      {!isMultiCompetitionEnabled() && (
        <CreateWaveAdvancedSection
          title={t(locale, "waves.create.quick.otherTypes")}
          summary={t(locale, "waves.create.quick.otherTypesSummary")}
          isCustomized={false}
          hasError={false}
        >
          <CreateWaveType
            selected={config.overview.type}
            errors={errors}
            onChange={(type) =>
              setOverview({ ...config.overview, type, typeSelected: true })
            }
          />
        </CreateWaveAdvancedSection>
      )}
    </div>
  );
}
