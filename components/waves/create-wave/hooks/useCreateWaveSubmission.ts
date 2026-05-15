import { useContext, useState, type RefObject } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { getCreateNewWaveBody } from "@/helpers/waves/create-wave.helpers";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { CreateWaveConfig } from "@/types/waves.types";
import { useRouter } from "next/navigation";
import type { CreateWaveDescriptionHandles } from "../description/CreateWaveDescription";
import { getCreateWaveDropRequest } from "../services/createWaveDropRequest";
import { multiPartUpload } from "../services/multiPartUpload";
import { useAddWaveMutation } from "../services/waveApiService";
import { getAdminGroupId } from "../services/waveGroupService";

interface UseCreateWaveSubmissionParams {
  readonly config: CreateWaveConfig;
  readonly descriptionRef: RefObject<CreateWaveDescriptionHandles | null>;
  readonly onSuccess?: (() => void) | undefined;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export function useCreateWaveSubmission({
  config,
  descriptionRef,
  onSuccess,
}: UseCreateWaveSubmissionParams) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { waitAndInvalidateDrops, onWaveCreated, onGroupCreate } = useContext(
    ReactQueryWrapperContext
  );
  const [submitting, setSubmitting] = useState(false);
  const [showDropError, setShowDropError] = useState(false);
  const { submit: submitInlineGroup } = useGroupMutations({
    requestAuth,
    onGroupCreate,
  });

  const addWaveMutation = useAddWaveMutation({
    onSuccess: (response) => {
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
        message: error as string,
        type: "error",
      });
    },
    onSettled: () => {
      setSubmitting(false);
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
          message: result.error,
          type: "error",
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
    setSubmitting(true);
    let mutationStarted = false;

    try {
      const { success } = await requestAuth();
      if (!success) {
        setSubmitting(false);
        return;
      }

      const drop = descriptionRef.current?.getDropSnapshot() ?? null;
      if (drop === null || drop.parts.length === 0) {
        setSubmitting(false);
        setShowDropError(true);
        return;
      }

      const adminGroupId = await getAdminGroupId({
        adminGroupId: config.groups.admin,
        primaryWallet: connectedProfile?.primary_wallet,
        handle: connectedProfile?.handle ?? undefined,
        onError: (error) => {
          setToast({
            message:
              typeof error === "string" ? error : "Failed to get admin group",
            type: "error",
          });
        },
      });
      if (!adminGroupId) {
        setSubmitting(false);
        return;
      }

      const dropRequest = await getCreateWaveDropRequest(drop);
      const picture = config.overview.image
        ? await multiPartUpload({ file: config.overview.image, path: "wave" })
        : null;

      const waveBody = getCreateNewWaveBody({
        config: {
          ...config,
          groups: {
            ...config.groups,
            admin: adminGroupId,
          },
        },
        picture: picture?.url ?? null,
        drop: dropRequest,
      });

      mutationStarted = true;
      await addWaveMutation.mutateAsync(waveBody);
    } catch (error) {
      if (!mutationStarted) {
        setToast({
          message: getErrorMessage(error, "Failed to create wave"),
          type: "error",
        });
        setSubmitting(false);
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
