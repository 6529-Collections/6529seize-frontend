import { act, renderHook } from "@testing-library/react";
import { useMutation } from "@tanstack/react-query";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";
import { useWaveGroupEditButtonsController } from "@/components/waves/specs/groups/group/edit/buttons/hooks/useWaveGroupEditButtonsController";

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useMutation: jest.fn(),
}));

const mockCommonApiPost = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: (...args: unknown[]) => mockCommonApiPost(...args),
}));

const mockValidateWaveGroups = jest.fn();
jest.mock("@/services/api/wave-group-validation-api", () => ({
  validateWaveGroups: (...args: unknown[]) => mockValidateWaveGroups(...args),
}));

const buildWave = () =>
  ({
    id: "wave-1",
    visibility: { scope: { group: null } },
    participation: {
      scope: { group: null },
      authenticated_user_eligible: true,
    },
    voting: { scope: { group: null }, authenticated_user_eligible: true },
    chat: { scope: { group: null }, authenticated_user_eligible: true },
    wave: {
      admin_group: { group: null },
      authenticated_user_eligible_for_admin: true,
    },
  }) as never;

const requestAuth = jest.fn().mockResolvedValue({ success: true });
const setToast = jest.fn();
const onWaveCreated = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  requestAuth.mockResolvedValue({ success: true });
  mockCommonApiPost.mockResolvedValue({});
  mockValidateWaveGroups.mockResolvedValue({ valid: true, invalid_roles: [] });
  (useMutation as jest.Mock).mockImplementation((options) => ({
    mutateAsync: async (body: unknown) => {
      try {
        const result = await options.mutationFn(body);
        options.onSuccess?.(result, body, undefined);
        options.onSettled?.(result, undefined, body, undefined);
        return result;
      } catch (error) {
        options.onError?.(error, body, undefined);
        options.onSettled?.(undefined, error, body, undefined);
        throw error;
      }
    },
  }));
});

describe("useWaveGroupEditButtonsController", () => {
  it("blocks a wave update when a privilege group is outside visibility", async () => {
    mockValidateWaveGroups.mockResolvedValue({
      valid: false,
      invalid_roles: ["CHAT"],
    });
    const { result } = renderHook(() =>
      useWaveGroupEditButtonsController({
        wave: buildWave(),
        type: WaveGroupType.CHAT,
        requestAuth,
        setToast,
        onWaveCreated,
      })
    );

    await act(async () => {
      const updated = await result.current.updateWave({
        visibility: { scope: { group_id: "view-group" } },
        participation: { scope: { group_id: null } },
        voting: { scope: { group_id: null } },
        chat: { enabled: true, scope: { group_id: null } },
        wave: { type: "CHAT", admin_group: null },
      } as never);
      expect(updated).toBe(false);
    });

    expect(mockValidateWaveGroups).toHaveBeenCalledTimes(1);
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
  });

  it("treats a disabled chat scope as inactive during an edit", async () => {
    const { result } = renderHook(() =>
      useWaveGroupEditButtonsController({
        wave: buildWave(),
        type: WaveGroupType.CHAT,
        requestAuth,
        setToast,
        onWaveCreated,
      })
    );

    await act(async () => {
      await result.current.updateWave({
        visibility: { scope: { group_id: "view-group" } },
        participation: { scope: { group_id: null } },
        voting: { scope: { group_id: null } },
        chat: { enabled: false, scope: { group_id: "inactive-chat" } },
        wave: { type: "CHAT", admin_group: null },
      } as never);
    });

    expect(mockValidateWaveGroups).toHaveBeenCalledWith({
      visibility_group_id: "view-group",
    });
    expect(mockCommonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "waves/wave-1" })
    );
  });

  it("validates a scoped chat group when visibility is public", async () => {
    const { result } = renderHook(() =>
      useWaveGroupEditButtonsController({
        wave: buildWave(),
        type: WaveGroupType.CHAT,
        requestAuth,
        setToast,
        onWaveCreated,
      })
    );

    await act(async () => {
      await result.current.updateWave({
        visibility: { scope: { group_id: null } },
        participation: { scope: { group_id: null } },
        voting: { scope: { group_id: null } },
        chat: { enabled: true, scope: { group_id: "chat-group" } },
        wave: { type: "CHAT", admin_group: null },
      } as never);
    });

    expect(mockValidateWaveGroups).toHaveBeenCalledWith({
      visibility_group_id: null,
      chat_group_id: "chat-group",
    });
    expect(onWaveCreated).toHaveBeenCalledTimes(1);
  });

  it("keeps the editor flow open when authentication fails", async () => {
    requestAuth.mockResolvedValue({ success: false });
    const { result } = renderHook(() =>
      useWaveGroupEditButtonsController({
        wave: buildWave(),
        type: WaveGroupType.VIEW,
        requestAuth,
        setToast,
        onWaveCreated,
      })
    );

    await act(async () => {
      const updated = await result.current.updateWave({
        visibility: { scope: { group_id: null } },
        participation: { scope: { group_id: null } },
        voting: { scope: { group_id: null } },
        chat: { enabled: true, scope: { group_id: null } },
        wave: { type: "CHAT", admin_group: null },
      } as never);
      expect(updated).toBe(false);
    });

    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(result.current.mutating).toBe(false);
  });
});
