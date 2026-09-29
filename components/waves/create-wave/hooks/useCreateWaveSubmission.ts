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
import type { CreateDropConfig } from "@/entities/IDrop";
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
import { useSubwaveAccessConfirmation } from "@/components/waves/hooks/useSubwaveAccessConfirmation";
import {
  isMultiCompetitionEnabled,
  isRejectedCompetitionCommand,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";
import { commonApiPost } from "@/services/api/common-api";
import type { ApiCreateWaveMetadataRequest } from "@/generated/models/ApiCreateWaveMetadataRequest";
import type { ApiCreateWaveHubRequest } from "@/generated/models/ApiCreateWaveHubRequest";
import type { ApiWaveV3 } from "@/generated/models/ApiWaveV3";

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
  const subwaveAccessConfirmation = useSubwaveAccessConfirmation();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { waitAndInvalidateDrops, onWaveCreated, onGroupCreate } = useContext(
    ReactQueryWrapperContext
  );
  const [submitting, setSubmitting] = useState(false);
  const submissionInProgressRef = useRef(false);
  const nativeHubRequest = useRef<ApiCreateWaveHubRequest | null>(null);
  const nativeDisplayMetadata = useRef<ApiCreateWaveMetadataRequest[]>([]);
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
        title: t(locale, "competitions.waveCreationFailure"),
        description: t(locale, "competitions.tryAgain"),
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

  const getDescriptionForReview = (): CreateDropConfig | null => {
    const drop = descriptionRef.current?.getDropSnapshot() ?? null;
    if (drop === null || drop.parts.length === 0) {
      setShowDropError(true);
      return null;
    }
    if (hasPendingInlineImageUploadDrop(drop)) {
      setToast({
        message: t(locale, "waves.create.review.uploadsPending"),
        type: "error",
      });
      return null;
    }
    setShowDropError(false);
    return drop;
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

      const drop = getDescriptionForReview();
      if (!drop) {
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

      const parentAccessConfirmed =
        await subwaveAccessConfirmation.confirmSubwaveAccess({
          parentWaveId,
          viewGroupId: config.groups.canView,
        });
      if (!parentAccessConfirmed) {
        finishSubmitting();
        return;
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

      if (isMultiCompetitionEnabled()) {
        if (!nativeHubRequest.current) {
          nativeDisplayMetadata.current = displayMetadataRequests;
          nativeHubRequest.current = {
            idempotency_key: newCompetitionRequestKey(),
            name: waveBody.name,
            picture: waveBody.picture,
            description_drop: waveBody.description_drop,
            visibility: waveBody.visibility,
            chat: waveBody.chat,
            admin_group: { group_id: adminGroupId },
            ...(parentWaveId ? { parent_wave_id: parentWaveId } : {}),
          };
        }
        const hub = await commonApiPost<ApiCreateWaveHubRequest, ApiWaveV3>({
          endpoint: "v3/waves",
          body: nativeHubRequest.current,
          errorMode: "structured",
        });
        if (nativeDisplayMetadata.current.length > 0) {
          try {
            await Promise.all(
              nativeDisplayMetadata.current.map((body) =>
                createWaveMetadata({ waveId: hub.id, body })
              )
            );
          } catch {
            setToast({
              type: "warning",
              message: t(locale, "competitions.hubDisplayFailure"),
            });
          }
        }
        const destination = getWaveRoute({
          waveId: hub.id,
          isDirectMessage: false,
          isApp,
        });
        nativeHubRequest.current = null;
        nativeDisplayMetadata.current = [];
        onWaveCreated();
        onSuccess?.();
        finishSubmitting();
        if (isApp) router.replace(destination);
        else router.push(destination);
        return;
      }

      mutationStarted = true;
      await addWaveMutation.mutateAsync({
        body: waveBody,
        displayMetadataRequests,
      });
    } catch (error) {
      if (isRejectedCompetitionCommand(error)) {
        nativeHubRequest.current = null;
      }
      if (!mutationStarted) {
        setToast({
          type: "error",
          title: t(locale, "competitions.waveCreationFailure"),
          description: nativeHubRequest.current
            ? t(locale, "competitions.hubRetry")
            : t(locale, "competitions.tryAgain"),
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
    getDescriptionForReview,
    subwaveAccessConfirmation,
  };
}
