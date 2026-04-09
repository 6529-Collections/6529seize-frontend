"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { publicEnv } from "@/config/env";
import type { ApiDropCurationRequest } from "@/generated/models/ApiDropCurationRequest";
import { commonApiDeleteWithBody } from "@/services/api/common-api";
import { getAuthJwt, getStagingAuth } from "@/services/auth/auth.utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import {
  getDropCurationsQueryKey,
  type DropCurationMembership,
} from "./useDropCurations";

type DropCurationMembershipAction = "add" | "remove";

interface DropCurationMembershipMutationVariables {
  readonly curationId: string;
  readonly action: DropCurationMembershipAction;
}

const getDropCurationMembershipEndpoint = (dropId: string): string =>
  `${publicEnv.API_ENDPOINT}/api/drops/${dropId}/curations`;

const getDropCurationMembershipHeaders = (): Record<string, string> => {
  const apiAuth = getStagingAuth();
  const walletAuth = getAuthJwt();

  return {
    "Content-Type": "application/json",
    ...(apiAuth ? { "x-6529-auth": apiAuth } : {}),
    ...(walletAuth ? { Authorization: `Bearer ${walletAuth}` } : {}),
  };
};

const getErrorMessageFromResponse = async (
  response: Response
): Promise<string> => {
  const fallbackErrorMessage = response.statusText || "Something went wrong";

  try {
    const rawContent = await response.text();
    if (!rawContent) {
      return fallbackErrorMessage;
    }

    try {
      const parsedBody = JSON.parse(rawContent) as Record<string, unknown>;
      if (typeof parsedBody["error"] === "string") {
        return parsedBody["error"];
      }
      if (typeof parsedBody["message"] === "string") {
        return parsedBody["message"];
      }
    } catch {
      return rawContent;
    }

    return rawContent;
  } catch {
    return fallbackErrorMessage;
  }
};

const addDropToCuration = async ({
  dropId,
  body,
}: {
  readonly dropId: string;
  readonly body: ApiDropCurationRequest;
}): Promise<void> => {
  const response = await fetch(getDropCurationMembershipEndpoint(dropId), {
    method: "POST",
    headers: getDropCurationMembershipHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessageFromResponse(response));
  }
};

export function useDropCurationMembershipMutation({
  dropId,
}: {
  readonly dropId: string;
}) {
  const queryClient = useQueryClient();
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { setToast } = useAuth();

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
        await addDropToCuration({
          dropId,
          body,
        });
        return;
      }

      await commonApiDeleteWithBody<ApiDropCurationRequest, void>({
        endpoint: `drops/${dropId}/curations`,
        body,
      });
    },
    onMutate: async ({ curationId, action }) => {
      await queryClient.cancelQueries({
        queryKey: getDropCurationsQueryKey(dropId),
      });

      const previousCurations = queryClient.getQueryData<
        DropCurationMembership[]
      >(getDropCurationsQueryKey(dropId));

      queryClient.setQueryData<DropCurationMembership[]>(
        getDropCurationsQueryKey(dropId),
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
      setToast({
        type: "success",
        message:
          variables.action === "add"
            ? "Drop added to curation."
            : "Drop removed from curation.",
      });
      invalidateDrops();
    },
    onError: (error, variables, context) => {
      if (context?.previousCurations !== undefined) {
        queryClient.setQueryData(
          getDropCurationsQueryKey(dropId),
          context.previousCurations
        );
      }

      const fallbackErrorMessage =
        variables.action === "add"
          ? "Failed to add drop to curation."
          : "Failed to remove drop from curation.";

      setToast({
        type: "error",
        message: error instanceof Error ? error.message : fallbackErrorMessage,
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: getDropCurationsQueryKey(dropId),
      });
    },
  });

  return {
    updateMembership: (
      curationId: string,
      action: DropCurationMembershipAction
    ) => mutation.mutate({ curationId, action }),
    isPending: mutation.isPending,
    pendingCurationId: mutation.isPending
      ? mutation.variables.curationId
      : null,
  };
}
