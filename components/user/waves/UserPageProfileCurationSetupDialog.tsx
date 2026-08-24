"use client";

import { useAuth } from "@/components/auth/Auth";
import {
  getAdminGroupId,
  WaveAdminGroupError,
} from "@/components/waves/create-wave/services/waveGroupService";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ApiWaveCurationRequest } from "@/generated/models/ApiWaveCurationRequest";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurations";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useProfileWaveMutation } from "@/hooks/useProfileWaveMutation";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { commonApiPost } from "@/services/api/common-api";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useContext, useRef, useState } from "react";
import {
  DEFAULT_PROFILE_CURATION_NAME,
  getProfileCurationSourceWaveName,
  getProfileCurationSourceWaveRequest,
} from "./userPageProfileWave.helpers";

type SetupStep = "permissions" | "source" | "curation" | "profile";

type SetupResources = {
  adminGroupId: string | null;
  wave: ApiWave | null;
  curation: ApiWaveCuration | null;
};

class ProfileCurationSetupError extends Error {
  readonly step: SetupStep;

  constructor(step: SetupStep, cause: unknown) {
    super(cause instanceof Error ? cause.message : "Curation setup failed.");
    this.name = "ProfileCurationSetupError";
    this.step = step;
  }
}

const getSetupErrorMessage = (
  locale: SupportedLocale,
  error: unknown
): string => {
  if (!(error instanceof ProfileCurationSetupError)) {
    return t(locale, "profileCuration.setup.error.generic");
  }

  switch (error.step) {
    case "permissions":
      return t(locale, "profileCuration.setup.error.permissions");
    case "source":
      return t(locale, "profileCuration.setup.error.source");
    case "curation":
      return t(locale, "profileCuration.setup.error.curation");
    case "profile":
      return t(locale, "profileCuration.setup.error.profile");
  }
};

const SETUP_STEPS = ["permissions", "source", "curation", "profile"] as const;
const SETUP_STEP_MESSAGE_KEYS = {
  permissions: "profileCuration.setup.step.permissions",
  source: "profileCuration.setup.step.source",
  curation: "profileCuration.setup.step.curation",
  profile: "profileCuration.setup.step.profile",
} as const;

export default function UserPageProfileCurationSetupDialog({
  profile,
  isOpen,
  onClose,
  onReady,
}: {
  readonly profile: ApiIdentity;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onReady: (result: {
    readonly wave: ApiWave;
    readonly curation: ApiWaveCuration;
  }) => void;
}) {
  const queryClient = useQueryClient();
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useAuth();
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const { updateProfileWaveOrThrow } = useProfileWaveMutation(profile);
  const [name, setName] = useState(DEFAULT_PROFILE_CURATION_NAME);
  const [activeStep, setActiveStep] = useState<SetupStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<SetupStep[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resourcesRef = useRef<SetupResources>({
    adminGroupId: null,
    wave: null,
    curation: null,
  });
  const trimmedName = name.trim();
  const handle = profile.handle?.trim() ?? "";
  const sourceWaveName = getProfileCurationSourceWaveName(handle || "Profile");
  const isSubmitting = activeStep !== null;

  const markStepComplete = (step: SetupStep) => {
    setCompletedSteps((current) =>
      current.includes(step) ? current : [...current, step]
    );
  };

  const ensureAdminGroup = async (): Promise<string> => {
    const existingId = resourcesRef.current.adminGroupId;
    if (existingId) {
      return existingId;
    }

    setActiveStep("permissions");
    let groupError: unknown = null;
    const adminGroupId = await getAdminGroupId({
      adminGroupId: null,
      primaryWallet: profile.primary_wallet,
      handle: profile.handle ?? undefined,
      onError: (error) => {
        groupError = error;
      },
    });
    if (!adminGroupId) {
      throw new ProfileCurationSetupError(
        "permissions",
        groupError ??
          new WaveAdminGroupError({ reason: "create-personal-group" })
      );
    }

    resourcesRef.current.adminGroupId = adminGroupId;
    markStepComplete("permissions");
    return adminGroupId;
  };

  const ensureSourceWave = async (adminGroupId: string): Promise<ApiWave> => {
    const existingWave = resourcesRef.current.wave;
    if (existingWave) {
      return existingWave;
    }

    setActiveStep("source");
    try {
      const wave = await commonApiPost<
        ReturnType<typeof getProfileCurationSourceWaveRequest>,
        ApiWave
      >({
        endpoint: "waves",
        body: getProfileCurationSourceWaveRequest({
          adminGroupId,
          handle,
        }),
        errorMode: "structured",
      });
      resourcesRef.current.wave = wave;
      markStepComplete("source");
      onWaveCreated();
      return wave;
    } catch (error) {
      throw new ProfileCurationSetupError("source", error);
    }
  };

  const ensureCuration = async ({
    adminGroupId,
    wave,
  }: {
    readonly adminGroupId: string;
    readonly wave: ApiWave;
  }): Promise<ApiWaveCuration> => {
    const existingCuration = resourcesRef.current.curation;
    if (existingCuration) {
      return existingCuration;
    }

    setActiveStep("curation");
    try {
      const curation = await commonApiPost<
        ApiWaveCurationRequest,
        ApiWaveCuration
      >({
        endpoint: `waves/${wave.id}/curations`,
        body: { name: trimmedName, group_id: adminGroupId },
        errorMode: "structured",
      });
      resourcesRef.current.curation = curation;
      queryClient.setQueryData<ApiWaveCuration[]>(
        getWaveCurationsQueryKey(wave.id),
        [curation]
      );
      markStepComplete("curation");
      return curation;
    } catch (error) {
      throw new ProfileCurationSetupError("curation", error);
    }
  };

  const handleCreate = async () => {
    if (isSubmitting || !handle || !trimmedName) {
      return;
    }

    setErrorMessage(null);

    try {
      const auth = await requestAuth();
      if (!auth.success) {
        throw new ProfileCurationSetupError(
          "permissions",
          new Error("Authentication was cancelled.")
        );
      }

      const adminGroupId = await ensureAdminGroup();
      const wave = await ensureSourceWave(adminGroupId);
      const curation = await ensureCuration({ adminGroupId, wave });
      setActiveStep("profile");
      try {
        await updateProfileWaveOrThrow(wave.id, curation.id, {
          suppressSuccessToast: true,
        });
      } catch (error) {
        throw new ProfileCurationSetupError("profile", error);
      }
      markStepComplete("profile");
      setActiveStep(null);
      setToast({
        type: "success",
        message: t(locale, "profileCuration.setup.ready"),
      });
      onReady({ wave, curation });
    } catch (error) {
      setActiveStep(null);
      setErrorMessage(getSetupErrorMessage(locale, error));
    }
  };

  return (
    <MobileWrapperDialog
      title={t(locale, "profileCuration.setup.title")}
      isOpen={isOpen}
      onClose={isSubmitting ? () => undefined : onClose}
      noPadding
      tabletModal
      tall
      maxWidthClass="md:tw-max-w-lg"
      headerClassName="tw-mb-0 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/[0.06] tw-py-4"
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-6 sm:tw-px-6">
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "profileCuration.setup.intro")}
          </p>

          <div className="tw-mt-6">
            <label
              htmlFor="profile-curation-name"
              className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
            >
              {t(locale, "profileCuration.setup.nameLabel")}
            </label>
            <input
              id="profile-curation-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              autoComplete="off"
              disabled={isSubmitting || completedSteps.includes("curation")}
              aria-describedby="profile-curation-name-help"
              className="tw-form-input tw-mt-2 tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-100 tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
            />
            <p
              id="profile-curation-name-help"
              className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500"
            >
              {t(locale, "profileCuration.setup.nameHelp")}
            </p>
          </div>

          {(isSubmitting || completedSteps.length > 0) && (
            <ol
              aria-label={t(locale, "profileCuration.setup.progressAria")}
              className="tw-mb-0 tw-mt-6 tw-grid tw-list-none tw-grid-cols-1 tw-gap-2 tw-p-0 sm:tw-grid-cols-2"
            >
              {SETUP_STEPS.map((step) => {
                const isComplete = completedSteps.includes(step);
                const isActive = activeStep === step;
                return (
                  <li
                    key={step}
                    className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-px-3 tw-py-2"
                  >
                    {isComplete ? (
                      <CheckCircleIcon className="tw-size-4 tw-flex-shrink-0 tw-text-emerald-400" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className={`tw-size-2 tw-flex-shrink-0 tw-rounded-full ${
                          isActive ? "tw-bg-primary-400" : "tw-bg-iron-700"
                        }`}
                      />
                    )}
                    <span
                      className={`tw-text-xs tw-font-medium ${
                        isActive || isComplete
                          ? "tw-text-iron-200"
                          : "tw-text-iron-500"
                      }`}
                    >
                      {t(locale, SETUP_STEP_MESSAGE_KEYS[step])}
                      {isActive ? "…" : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="tw-mt-6 tw-rounded-lg tw-border tw-border-solid tw-border-rose-500/25 tw-bg-rose-500/10 tw-px-4 tw-py-3"
            >
              <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-rose-200">
                {errorMessage}
              </p>
            </div>
          )}

          <details className="tw-mt-6 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-px-4 tw-py-3">
            <summary className="tw-cursor-pointer tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400">
              {t(locale, "profileCuration.setup.advancedSummary")}
            </summary>
            <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
              {t(locale, "profileCuration.setup.advancedDetails", {
                sourceWaveName,
              })}
            </p>
          </details>
        </div>

        <div className="tw-flex tw-flex-shrink-0 tw-justify-end tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-px-4 tw-py-4 sm:tw-px-6">
          <Button
            type="button"
            onClick={onClose}
            variant="tertiary"
            size="md"
            disabled={isSubmitting}
          >
            {t(locale, "profileCuration.setup.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={!handle || !trimmedName}
          >
            {errorMessage
              ? t(locale, "profileCuration.setup.continue")
              : t(locale, "profileCuration.setup.create")}
          </Button>
        </div>
      </div>
    </MobileWrapperDialog>
  );
}
