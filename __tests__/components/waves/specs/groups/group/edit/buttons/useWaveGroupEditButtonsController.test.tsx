import { act, renderHook } from '@testing-library/react';
import { ApiGroupFilterDirection } from '@/generated/models/ApiGroupFilterDirection';
import {
  useWaveGroupEditButtonsController,
  WaveGroupIdentitiesModal,
} from '@/components/waves/specs/groups/group/edit/buttons/hooks/useWaveGroupEditButtonsController';
import { WaveGroupType } from '@/components/waves/specs/groups/group/WaveGroup.types';
import { useMutation } from '@tanstack/react-query';
import {
  createGroup as createGroupMutation,
  publishGroup as publishGroupMutation,
} from '@/services/groups/groupMutations';

jest.mock('@tanstack/react-query', () => ({ useMutation: jest.fn() }));

const mockCommonApiFetch = jest.fn();
const mockCommonApiPost = jest.fn();

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: (...args: any[]) => mockCommonApiFetch(...args),
  commonApiPost: (...args: any[]) => mockCommonApiPost(...args),
}));

jest.mock('@/services/groups/groupMutations', () => {
  const actual = jest.requireActual('@/services/groups/groupMutations');
  return {
    ...actual,
    createGroup: jest.fn(),
    publishGroup: jest.fn(),
  };
});

const mutateAsyncSpy = jest.fn();

(useMutation as jest.Mock).mockImplementation((options: any) => ({
  mutateAsync: async (params?: any) => {
    try {
      const result = await options.mutationFn(params);
      options.onSuccess?.(result, params, undefined);
      options.onSettled?.(result, undefined, params, undefined);
      mutateAsyncSpy(params);
      return result;
    } catch (error) {
      options.onError?.(error, params, undefined);
      options.onSettled?.(undefined, error, params, undefined);
      mutateAsyncSpy(params);
      throw error;
    }
  },
}));

const mockCreateGroup = createGroupMutation as jest.Mock;
const mockPublishGroup = publishGroupMutation as jest.Mock;

const connectedProfile = { id: 'u1', handle: 'alice' } as any;

const baseGroupFull = {
  id: 'group-1',
  name: 'Existing Group',
  group: {
    tdh: { min: null, max: null },
    rep: {
      min: null,
      max: null,
      direction: ApiGroupFilterDirection.Received,
      user_identity: null,
      category: null,
    },
    cic: {
      min: null,
      max: null,
      direction: ApiGroupFilterDirection.Received,
      user_identity: null,
    },
    level: { min: null, max: null },
    owns_nfts: [],
    identity_group_id: 'include-group',
    identity_group_identities_count: 0,
    excluded_identity_group_id: 'exclude-group',
    excluded_identity_group_identities_count: 0,
  },
  created_at: Date.now(),
  created_by: { id: 'u1', handle: 'alice' },
  visible: true,
  is_private: false,
};

const buildWave = (withGroup: boolean) => ({
  id: 'wave-1',
  name: 'Wave Alpha',
  visibility: {
    scope: {
      group: withGroup
        ? { id: baseGroupFull.id, author: { id: 'u1', handle: 'alice' } }
        : null,
    },
  },
  participation: {
    scope: { group: null },
    authenticated_user_eligible: true,
  },
  voting: {
    scope: { group: null },
    authenticated_user_eligible: true,
  },
  chat: {
    scope: { group: null },
    authenticated_user_eligible: true,
  },
  wave: {
    admin_group: { group: null },
    authenticated_user_eligible_for_admin: true,
  },
}) as any;

const requestAuth = jest.fn().mockResolvedValue({ success: true });
const setToast = jest.fn();
const onWaveCreated = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockCommonApiPost.mockResolvedValue({});
  mockCreateGroup.mockResolvedValue({
    ...baseGroupFull,
    id: 'new-group-id',
  });
  mockPublishGroup.mockResolvedValue(undefined);
  mutateAsyncSpy.mockClear();
});

describe('useWaveGroupEditButtonsController - identity management', () => {
  it('includes identity by recreating the existing group', async () => {
    mockCommonApiFetch.mockImplementation(({ endpoint }: { endpoint: string }) => {
      if (endpoint === `groups/${baseGroupFull.id}`) {
        return Promise.resolve(baseGroupFull);
      }
      if (endpoint === `groups/${baseGroupFull.id}/identity_groups/${baseGroupFull.group.identity_group_id}`) {
        return Promise.resolve<string[]>([]);
      }
      if (endpoint === `groups/${baseGroupFull.id}/identity_groups/${baseGroupFull.group.excluded_identity_group_id}`) {
        return Promise.resolve<string[]>(['0xabcd']);
      }
      throw new Error(`Unexpected endpoint ${endpoint}`);
    });

    const { result } = renderHook(() =>
      useWaveGroupEditButtonsController({
        haveGroup: true,
        wave: buildWave(true),
        type: WaveGroupType.VIEW,
        connectedProfile,
        requestAuth,
        setToast,
        onWaveCreated,
      }),
    );

    await act(async () => {
      await result.current.onIdentityConfirm({
        identity: '0xABCD',
        mode: WaveGroupIdentitiesModal.INCLUDE,
      });
    });

    expect(requestAuth).toHaveBeenCalled();
    expect(mockCreateGroup).toHaveBeenCalledTimes(1);
    const payloadArg = mockCreateGroup.mock.calls[0][0].payload;
    expect(payloadArg.group.identity_addresses).toEqual(['0xabcd']);
    expect(payloadArg.group.excluded_identity_addresses).toBeNull();
    expect(mockPublishGroup).toHaveBeenCalledWith({
      id: 'new-group-id',
      oldVersionId: baseGroupFull.id,
    });
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(mutateAsyncSpy).not.toHaveBeenCalled();
    expect(onWaveCreated).toHaveBeenCalledTimes(1);
    expect(setToast).toHaveBeenCalledWith({
      message: 'Identity successfully included in the group.',
      type: 'success',
    });
  });

  it('blocks including identities when no group exists', async () => {
    mockCommonApiFetch.mockReset();

    const { result } = renderHook(() =>
      useWaveGroupEditButtonsController({
        haveGroup: false,
        wave: buildWave(false),
        type: WaveGroupType.VIEW,
        connectedProfile,
        requestAuth,
        setToast,
        onWaveCreated,
      }),
    );

    expect(result.current.canIncludeIdentity).toBe(false);

    await act(async () => {
      await result.current.onIdentityConfirm({
        identity: '0xFACE',
        mode: WaveGroupIdentitiesModal.INCLUDE,
      });
    });

    expect(requestAuth).not.toHaveBeenCalled();
    expect(mockCreateGroup).not.toHaveBeenCalled();
    expect(mockPublishGroup).not.toHaveBeenCalled();
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(mutateAsyncSpy).not.toHaveBeenCalled();
    expect(onWaveCreated).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith({
      message: 'You need to define group filters before including specific identities.',
      type: 'error',
    });
  });

  it('moves identity from include to exclude list', async () => {
    mockCommonApiFetch.mockImplementation(({ endpoint }: { endpoint: string }) => {
      if (endpoint === `groups/${baseGroupFull.id}`) {
        return Promise.resolve(baseGroupFull);
      }
      if (endpoint === `groups/${baseGroupFull.id}/identity_groups/${baseGroupFull.group.identity_group_id}`) {
        return Promise.resolve<string[]>(['0xAAA', '0xbbb']);
      }
      if (endpoint === `groups/${baseGroupFull.id}/identity_groups/${baseGroupFull.group.excluded_identity_group_id}`) {
        return Promise.resolve<string[]>(['0xccc']);
      }
      throw new Error(`Unexpected endpoint ${endpoint}`);
    });

    const { result } = renderHook(() =>
      useWaveGroupEditButtonsController({
        haveGroup: true,
        wave: buildWave(true),
        type: WaveGroupType.VIEW,
        connectedProfile,
        requestAuth,
        setToast,
        onWaveCreated,
      }),
    );

    await act(async () => {
      await result.current.onIdentityConfirm({
        identity: '0xAAA',
        mode: WaveGroupIdentitiesModal.EXCLUDE,
      });
    });

    const payloadArg = mockCreateGroup.mock.calls[0][0].payload;
    expect(payloadArg.group.identity_addresses).toEqual(['0xbbb']);
    expect(payloadArg.group.excluded_identity_addresses).toContain('0xaaa');
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(mutateAsyncSpy).not.toHaveBeenCalled();
    expect(onWaveCreated).toHaveBeenCalledTimes(1);
    expect(setToast).toHaveBeenCalledWith({
      message: 'Identity successfully excluded from the group.',
      type: 'success',
    });
  });

  it('falls back to empty lists when identity group fetch fails', async () => {
    mockCommonApiFetch.mockImplementation(({ endpoint }: { endpoint: string }) => {
      if (endpoint === `groups/${baseGroupFull.id}`) {
        return Promise.resolve(baseGroupFull);
      }
      return Promise.reject(new Error('Group does not have identity group'));
    });

    const { result } = renderHook(() =>
      useWaveGroupEditButtonsController({
        haveGroup: true,
        wave: buildWave(true),
        type: WaveGroupType.VIEW,
        connectedProfile,
        requestAuth,
        setToast,
        onWaveCreated,
      }),
    );

    await act(async () => {
      await result.current.onIdentityConfirm({
        identity: '0xF00',
        mode: WaveGroupIdentitiesModal.INCLUDE,
      });
    });

    const payloadArg = mockCreateGroup.mock.calls[0][0].payload;
    expect(payloadArg.group.identity_addresses).toEqual(['0xf00']);
    expect(payloadArg.group.excluded_identity_addresses).toBeNull();
    expect(mockCommonApiPost).not.toHaveBeenCalled();
    expect(mutateAsyncSpy).not.toHaveBeenCalled();
    expect(onWaveCreated).toHaveBeenCalledTimes(1);
  });
});
