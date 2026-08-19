import { useContext, useRef, useState, type RefObject } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { getCreateNewWaveBody } from "@/helpers/waves/create-wave.helpers";
import { getCreateWaveDisplayMetadataRequests } from "@/helpers/waves/wave-metadata.helpers";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { createWaveMetadata } from "@/services/api/waves-v2-api";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { CreateWaveConfig } from "@/types/waves.types";
import { useRouter } from "next/navigation";
import { hasPendingInlineImageUploadDrop } from "@/helpers/waves/inline-image-upload.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CreateWaveDescriptionHandles } from "../description/CreateWaveDescription";
import { getCreateWaveDropRequest } from "../services/createWaveDropRequest";
import { multiPartUpload } from "../services/multiPartUpload";
import { useAddWaveMutation } from "../services/waveApiService";
import {
  getAdminGroupId,
  WaveAdminGroupError,
} from "../services/waveGroupService";
import { getWaveGroupValidationRequest } from "@/helpers/waves/wave-group-validation.helpers";
import { validateWaveGroups } from "@/services/api/wave-group-validation-api";

interface UseCreateWaveSubmissionParams {
  readonly config: CreateWaveConfig;
  readonly descriptionRef: RefObject<CreateWaveDescriptionHandles | null>;
  readonly onSuccess?: (() => void) | undefined;
  readonly parentWaveId?: string | null | undefined;
  readonly parentAdminGroupId?: string | null | undefined;
}

const getAdminGroupErrorToast = (error: unknown, locale: SupportedLocale) => {
  if (!(error instanceof WaveAdminGroupError)) {
    return {
      type: "error" as const,
      title: t(locale, "waves.create.groups.error.createAdmin.title"),
      description: t(
        locale,
        "waves.create.groups.error.createAdmin.description"
      ),
      details: getToastErrorDetails(
        error,
        t(locale, "waves.create.groups.error.fallbackDetails")
      ),
    };
  }

  if (error.reason === "missing-primary-wallet") {
    return {
      type: "error" as const,
      title: t(locale, "waves.create.groups.error.missingWallet.title"),
      description: t(
        locale,
        "waves.create.groups.error.missingWallet.description"
      ),
    };
  }

  const isPublishFailure = error.reason === "publish-personal-group";

  return {
    type: "error" as const,
    title: t(
      locale,
      isPublishFailure
        ? "waves.create.groups.error.publishAdmin.title"
        : "waves.create.groups.error.createAdmin.title"
    ),
    description: t(
      locale,
      isPublishFailure
        ? "waves.create.groups.error.publishAdmin.description"
        : "waves.create.groups.error.createAdmin.description"
    ),
    details: getToastErrorDetails(
      error.cause,
      t(locale, "waves.create.groups.error.fallbackDetails")
    ),
  };
};

export function useCreateWaveSubmission({
  config,
  descriptionRef,
  onSuccess,
  parentWaveId,
  parentAdminGroupId,
}: UseCreateWaveSubmissionParams) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { waitAndInvalidateDrops, onWaveCreated, onGroupCreate } = useContext(
    ReactQueryWrapperContext
  );
  const [submitting, setSubmitting] = useState(false);
  const submissionInProgressRef = useRef(false);
  const [showDropError, setShowDropError] = useState(false);
  const { submit: submitInlineGroup } = useGroupMutations({
    requestAuth,
    onGroupCreate,
  });
  const finishSubmitting = () => {
    submissionInProgressRef.current = false;
    setSubmitting(false);
  };

  const addWaveMutation = useAddWaveMutation({
    onSuccess: async (response, variables) => {
      if (variables.displayMetadataRequests.length > 0) {
        try {
          await Promise.all(
            variables.displayMetadataRequests.map((body) =>
              createWaveMetadata({
                waveId: response.id,
                body,
              })
            )
          );
        } catch {
          setToast({
            message:
              "Wave created, but custom display settings were not saved.",
            type: "warning",
          });
        }
      }

      void waitAndInvalidateDrops();
      onWaveCreated();
      onSuccess?.();
      const createdWaveRoute = getWaveRoute({
        waveId: response.id,
        isDirectMessage: false,
        isApp,
      });
      if (isApp) {
        router.replace(createdWaveRoute);
      } else {
        router.push(createdWaveRoute);
      }
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't create this wave.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      finishSubmitting();
    },
  });

  const onHaveDropToSubmitChange = (haveDrop: boolean) => {
    if (haveDrop) {
      setShowDropError(false);
    }
  };

  const onInlineGroupCreate = async (
    payload: ApiCreateGroup
  ): Promise<ApiGroupFull | null> => {
    const result = await submitInlineGroup({
      payload,
      currentHandle: connectedProfile?.handle ?? null,
    });

    if (!result.ok) {
      if (result.reason !== "auth") {
        setToast({
          type: "error",
          title: "Couldn't create this group.",
          description: "Please check the group setup and try again.",
          details: result.error,
        });
      }
      return null;
    }

    setToast({
      message: "Group created and attached.",
      type: "success",
    });

    return result.group;
  };

  const onComplete = async (): Promise<void> => {
    if (submissionInProgressRef.current) {
      return;
    }

    submissionInProgressRef.current = true;
    setSubmitting(true);
    let mutationStarted = false;

    try {
      const { success } = await requestAuth();
      if (!success) {
        finishSubmitting();
        return;
      }

      const drop = descriptionRef.current?.getDropSnapshot() ?? null;
      if (drop === null || drop.parts.length === 0) {
        finishSubmitting();
        setShowDropError(true);
        return;
      }

      if (hasPendingInlineImageUploadDrop(drop)) {
        setToast({
          message: "Wait for image uploads to finish.",
          type: "error",
        });
        finishSubmitting();
        return;
      }

      const configuredAdminGroupId =
        config.groups.admin ?? parentAdminGroupId ?? null;
      if (config.groups.canView !== null) {
        let groupValidation;
        try {
          groupValidation = await validateWaveGroups(
            getWaveGroupValidationRequest({
              groups: {
                ...config.groups,
                admin: configuredAdminGroupId,
              },
              waveType: config.overview.type,
              chatEnabled: config.chat.enabled,
              includeAuthenticatedUserAsAdmin: true,
            })
          );
        } catch {
          setToast({
            type: "error",
            title: t(locale, "waves.create.groups.validation.unavailableTitle"),
            description: t(
              locale,
              "waves.create.groups.validation.unavailable"
            ),
          });
          finishSubmitting();
          return;
        }
        if (!groupValidation.valid) {
          setToast({
            type: "error",
            title: t(locale, "waves.create.groups.validation.invalidTitle"),
            description: t(
              locale,
              "waves.create.groups.validation.invalidDescription"
            ),
          });
          finishSubmitting();
          return;
        }
      }

      const adminGroupId = await getAdminGroupId({
        adminGroupId: configuredAdminGroupId,
        primaryWallet: connectedProfile?.primary_wallet,
        handle: connectedProfile?.handle ?? undefined,
        onError: (error) => {
          setToast(getAdminGroupErrorToast(error, locale));
        },
      });
      if (!adminGroupId) {
        finishSubmitting();
        return;
      }

      const dropRequest = await getCreateWaveDropRequest(drop);
      const picture = config.overview.image
        ? await multiPartUpload({ file: config.overview.image, path: "wave" })
        : null;

      const submissionConfig: CreateWaveConfig = {
        ...config,
        groups: {
          ...config.groups,
          admin: adminGroupId,
        },
      };
      const waveBody = getCreateNewWaveBody({
        config: submissionConfig,
        picture: picture?.url ?? null,
        drop: dropRequest,
        parentWaveId,
      });
      const displayMetadataRequests = getCreateWaveDisplayMetadataRequests({
        display: submissionConfig.display,
        waveType: submissionConfig.overview.type,
        ongoingRanking: submissionConfig.dates.ongoingRanking ?? false,
      });

      mutationStarted = true;
      await addWaveMutation.mutateAsync({
        body: waveBody,
        displayMetadataRequests,
      });
    } catch (error) {
      if (!mutationStarted) {
        setToast({
          type: "error",
          title: "Couldn't create this wave.",
          description: "Please try again.",
          details: getToastErrorDetails(error, "Could not create wave."),
        });
        finishSubmitting();
      }
    }
  };

  return {
    submitting,
    showDropError,
    onHaveDropToSubmitChange,
    onInlineGroupCreate,
    onComplete,
  };
}
