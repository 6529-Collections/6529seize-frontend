"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDropCurationRequest } from "@/generated/models/ApiDropCurationRequest";
import {
  deleteDropCuration,
  postDropCuration,
} from "@/services/api/drop-curations-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import {
  getDropCurationsQueryKey,
  type DropCurationMembership,
} from "./useDropCurations";
import { getAuthJwt } from "@/services/auth/auth.utils";

type DropCurationMembershipAction = "add" | "remove";

interface DropCurationMembershipMutationOptions {
  readonly suppressToast?: boolean | undefined;
}

interface DropCurationMembershipMutationVariables {
  readonly curationId: string;
  readonly action: DropCurationMembershipAction;
  readonly options?: DropCurationMembershipMutationOptions | undefined;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const isPermissionErrorMessage = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("forbidden") ||
    normalizedMessage.includes("not authorized") ||
    normalizedMessage.includes("not allowed") ||
    normalizedMessage.includes("cannot curate") ||
    normalizedMessage.includes("can't curate") ||
    normalizedMessage.includes("not a member")
  );
};

const getCurationMembershipErrorMessage = (
  error: unknown,
  action: DropCurationMembershipAction
): string => {
  const fallbackErrorMessage =
    action === "add"
      ? "Failed to add drop to curation."
      : "Failed to remove drop from curation.";
  const errorMessage = getErrorMessage(error, fallbackErrorMessage);

  if (isPermissionErrorMessage(errorMessage)) {
    return action === "add"
      ? "You can't add this drop because you can't curate with the selected group."
      : "You can't remove this drop because you can't curate with the selected group.";
  }

  return errorMessage;
};

export function useDropCurationMembershipMutation({
  dropId,
}: {
  readonly dropId: string;
}) {
  const queryClient = useQueryClient();
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { setToast, connectedProfile, activeProfileProxy } = useAuth();
  const dropCurationsQueryKey = getDropCurationsQueryKey({
    dropId,
    connectedProfileId: connectedProfile?.id ?? null,
    activeProfileProxyId: activeProfileProxy?.id ?? null,
    hasAuthJwt: Boolean(getAuthJwt()),
  });

  const mutation = useMutation<
    void,
    Error,
    DropCurationMembershipMutationVariables,
    { previousCurations?: DropCurationMembership[] | undefined }
  >({
    mutationFn: async ({ curationId, action }) => {
      const body: ApiDropCurationRequest = {
        curation_id: curationId,
      };

      if (action === "add") {
        await postDropCuration({
          dropId,
          body,
        });
        return;
      }

      await deleteDropCuration({
        dropId,
        body,
      });
    },
    onMutate: async ({ curationId, action }) => {
      await queryClient.cancelQueries({
        queryKey: dropCurationsQueryKey,
      });

      const previousCurations = queryClient.getQueryData<
        DropCurationMembership[]
      >(dropCurationsQueryKey);

      queryClient.setQueryData<DropCurationMembership[]>(
        dropCurationsQueryKey,
        (current) =>
          current?.map((curation) =>
            curation.id === curationId
              ? {
                  ...curation,
                  drop_included: action === "add",
                }
              : curation
          ) ?? current
      );

      return { previousCurations };
    },
    onSuccess: (_data, variables) => {
      if (!variables.options?.suppressToast) {
        setToast({
          type: "success",
          message:
            variables.action === "add"
              ? "Drop added to curation."
              : "Drop removed from curation.",
        });
      }
      invalidateDrops();
    },
    onError: (error, variables, context) => {
      if (context?.previousCurations !== undefined) {
        queryClient.setQueryData(
          dropCurationsQueryKey,
          context.previousCurations
        );
      }

      if (!variables.options?.suppressToast) {
        setToast({
          type: "error",
          message: getCurationMembershipErrorMessage(error, variables.action),
        });
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: dropCurationsQueryKey,
      });
    },
  });

  return {
    updateMembership: (
      curationId: string,
      action: DropCurationMembershipAction,
      options?: DropCurationMembershipMutationOptions
    ) => mutation.mutate({ curationId, action, options }),
    updateMembershipAsync: (
      curationId: string,
      action: DropCurationMembershipAction,
      options?: DropCurationMembershipMutationOptions
    ) => mutation.mutateAsync({ curationId, action, options }),
    isPending: mutation.isPending,
    pendingCurationId: mutation.isPending
      ? mutation.variables.curationId
      : null,
  };
}
