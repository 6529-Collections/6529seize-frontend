import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import {
  createGroup,
  hideGroup,
  publishGroup,
  validateGroupPayload as validateGroupPayloadLocal,
  toErrorMessage,
} from "@/services/groups/groupMutations";
import type { ValidationResult as GroupValidationResult } from "@/services/groups/groupMutations";

export interface SubmitArgs {
  readonly payload: ApiCreateGroup;
  readonly previousGroup?: ApiGroupFull | null | undefined;
  readonly currentHandle?: string | null | undefined;
  readonly publish?: boolean | undefined;
}

type SubmitResult =
  | {
      readonly ok: true;
      readonly group: ApiGroupFull;
      readonly published: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: "validation" | "auth" | "api" | "busy";
      readonly error: string;
      readonly validation?: GroupValidationResult | undefined;
    };

interface TestArgs {
  readonly payload: ApiCreateGroup;
  readonly nameFallback: string;
}

type TestResult =
  | {
      readonly ok: true;
      readonly group: ApiGroupFull;
    }
  | {
      readonly ok: false;
      readonly reason: "validation" | "auth" | "api" | "busy";
      readonly error: string;
      readonly validation?: GroupValidationResult | undefined;
    };

interface UseGroupMutationsArgs {
  readonly requestAuth: () => Promise<{ success: boolean }>;
  readonly onGroupCreate?: (() => void) | undefined;
}

interface UpdateVisibilityArgs {
  readonly groupId: string;
  readonly visible: boolean;
  readonly oldVersionId?: string | null | undefined;
  readonly skipAuth?: boolean | undefined;
}

type UpdateVisibilityResult =
  | {
      readonly ok: true;
      readonly groupId: string;
      readonly visible: boolean;
      readonly group?: ApiGroupFull | undefined;
    }
  | {
      readonly ok: false;
      readonly reason: "auth" | "api" | "busy";
      readonly error: string;
    };

const resolveOldVersionId = ({
  previousGroup,
  currentHandle,
}: {
  readonly previousGroup?: ApiGroupFull | null | undefined;
  readonly currentHandle?: string | null | undefined;
}): string | null => {
  if (!previousGroup?.id) {
    return null;
  }

  const previousHandle = previousGroup.created_by?.handle;
  if (!previousHandle || !currentHandle) {
    return null;
  }

  return previousHandle.toLowerCase() === currentHandle.toLowerCase()
    ? previousGroup.id
    : null;
};

export const useGroupMutations = ({
  requestAuth,
  onGroupCreate,
}: UseGroupMutationsArgs) => {
  const createGroupMutation = useMutation({
    mutationFn: async ({
      payload,
      nameOverride,
    }: {
      readonly payload: ApiCreateGroup;
      readonly nameOverride?: string | undefined;
    }) => await createGroup({ payload, nameOverride }),
  });

  const publishGroupMutation = useMutation({
    mutationFn: async ({
      id,
      oldVersionId,
    }: {
      readonly id: string;
      readonly oldVersionId: string | null;
    }) => await publishGroup({ id, oldVersionId }),
  });

  const hideGroupMutation = useMutation({
    mutationFn: async (groupId: string) => await hideGroup({ id: groupId }),
  });

  const testGroupMutation = useMutation({
    mutationFn: async ({
      payload,
      nameOverride,
    }: {
      readonly payload: ApiCreateGroup;
      readonly nameOverride?: string | undefined;
    }) => await createGroup({ payload, nameOverride }),
  });

  const updateVisibility = useCallback(
    async ({
      groupId,
      visible,
      oldVersionId = null,
      skipAuth = false,
    }: UpdateVisibilityArgs): Promise<UpdateVisibilityResult> => {
      const isPublishing = visible;
      const isPending = isPublishing
        ? publishGroupMutation.isPending
        : hideGroupMutation.isPending;

      if (isPending) {
        return {
          ok: false,
          reason: "busy",
          error: "Another group action is already running.",
        };
      }

      if (!skipAuth) {
        const authResult = await requestAuth();
        if (!authResult.success) {
          return {
            ok: false,
            reason: "auth",
            error: "Authentication was cancelled.",
          };
        }
      }

      let updatedGroup: ApiGroupFull | undefined;
      try {
        if (visible) {
          updatedGroup = await publishGroupMutation.mutateAsync({
            id: groupId,
            oldVersionId,
          });
          onGroupCreate?.();
        } else {
          await hideGroupMutation.mutateAsync(groupId);
        }
      } catch (error) {
        return {
          ok: false,
          reason: "api",
          error: toErrorMessage(error),
        };
      }

      return {
        ok: true,
        groupId,
        visible,
        ...(updatedGroup ? { group: updatedGroup } : {}),
      };
    },
    [hideGroupMutation, onGroupCreate, publishGroupMutation, requestAuth]
  );

  const submit = useCallback(
    async ({
      payload,
      previousGroup = null,
      currentHandle = null,
      publish = true,
    }: SubmitArgs): Promise<SubmitResult> => {
      if (createGroupMutation.isPending || publishGroupMutation.isPending) {
        return {
          ok: false,
          reason: "busy",
          error: "Another group action is already running.",
        };
      }

      const trimmedName = payload.name.trim();
      if (!trimmedName.length) {
        return {
          ok: false,
          reason: "validation",
          error: "Please name your group.",
        };
      }

      const validation = validateGroupPayloadLocal(payload);
      if (!validation.valid) {
        return {
          ok: false,
          reason: "validation",
          error: "Group configuration is invalid.",
          validation,
        };
      }

      const authResult = await requestAuth();
      if (!authResult.success) {
        return {
          ok: false,
          reason: "auth",
          error: "Authentication was cancelled.",
        };
      }

      let created: ApiGroupFull;
      try {
        created = await createGroupMutation.mutateAsync({
          payload,
          nameOverride: trimmedName,
        });
      } catch (error) {
        return {
          ok: false,
          reason: "api",
          error: toErrorMessage(error),
        };
      }

      if (!publish) {
        return {
          ok: true,
          group: created,
          published: false,
        };
      }

      const oldVersionId = resolveOldVersionId({
        previousGroup,
        currentHandle,
      });

      const visibilityResult = await updateVisibility({
        groupId: created.id,
        visible: true,
        oldVersionId,
        skipAuth: true,
      });

      if (!visibilityResult.ok) {
        return {
          ok: false,
          reason: visibilityResult.reason,
          error: visibilityResult.error,
        };
      }

      return {
        ok: true,
        group: visibilityResult.group ?? created,
        published: true,
      };
    },
    [createGroupMutation, publishGroupMutation, requestAuth, updateVisibility]
  );

  const runTest = useCallback(
    async ({ payload, nameFallback }: TestArgs): Promise<TestResult> => {
      if (testGroupMutation.isPending) {
        return {
          ok: false,
          reason: "busy",
          error: "Another group test is already running.",
        };
      }

      const trimmedName = payload.name.trim();
      const effectiveName = trimmedName.length ? trimmedName : nameFallback;

      const validation = validateGroupPayloadLocal(payload);
      if (!validation.valid) {
        return {
          ok: false,
          reason: "validation",
          error: "Group configuration is invalid.",
          validation,
        };
      }

      const authResult = await requestAuth();
      if (!authResult.success) {
        return {
          ok: false,
          reason: "auth",
          error: "Authentication was cancelled.",
        };
      }

      try {
        const created = await testGroupMutation.mutateAsync({
          payload,
          nameOverride: effectiveName,
        });
        return {
          ok: true,
          group: created,
        };
      } catch (error) {
        return {
          ok: false,
          reason: "api",
          error: toErrorMessage(error),
        };
      }
    },
    [requestAuth, testGroupMutation]
  );

  return {
    validate: validateGroupPayloadLocal,
    submit,
    runTest,
    updateVisibility,
    isSubmitting:
      createGroupMutation.isPending || publishGroupMutation.isPending,
    isTesting: testGroupMutation.isPending,
    isUpdatingVisibility:
      publishGroupMutation.isPending || hideGroupMutation.isPending,
  };
};
