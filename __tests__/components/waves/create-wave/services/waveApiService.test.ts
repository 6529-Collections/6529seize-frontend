import { renderHook, act } from '@testing-library/react';
import { useAddWaveMutation } from '@/components/waves/create-wave/services/waveApiService';
import { commonApiPost } from '@/services/api/common-api';

jest.mock('@/services/api/common-api');

const useMutationMock = jest.fn((options: any) => {
  const mutateAsync = jest.fn(async (body?: any) => {
    try {
      const result = await options.mutationFn(body);
      options.onSuccess?.(result);
      options.onSettled?.();
      return result;
    } catch (err) {
      options.onError?.(err);
      options.onSettled?.();
      throw err;
    }
  });
  return { mutateAsync };
});

jest.mock('@tanstack/react-query', () => ({ useMutation: (opts: any) => useMutationMock(opts) }));

describe('useAddWaveMutation', () => {
  it('posts new wave and triggers callbacks', async () => {
    (commonApiPost as jest.Mock).mockResolvedValue({ id: 1 });
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onSettled = jest.fn();
    const { result } = renderHook(() => useAddWaveMutation({ onSuccess, onError, onSettled }));
    await act(() => result.current.mutateAsync({ 
      name: 'wave',
      picture: null,
      description_drop: {} as any,
      voting: {} as any,
      visibility: {} as any,
      participation: {} as any,
      chat: {} as any,
      wave: {} as any,
      outcomes: []
    }));
    expect(commonApiPost).toHaveBeenCalledWith({ 
      endpoint: 'waves', 
      body: {
        name: 'wave',
        picture: null,
        description_drop: {},
        voting: {},
        visibility: {},
        participation: {},
        chat: {},
        wave: {},
        outcomes: []
      }
    });
    expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
    expect(onSettled).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('handles errors', async () => {
    const error = new Error('fail');
    (commonApiPost as jest.Mock).mockRejectedValue(error);
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const onSettled = jest.fn();
    const { result } = renderHook(() => useAddWaveMutation({ onSuccess, onError, onSettled }));
    await expect(result.current.mutateAsync({ 
      name: 'x',
      picture: null,
      description_drop: {} as any,
      voting: {} as any,
      visibility: {} as any,
      participation: {} as any,
      chat: {} as any,
      wave: {} as any,
      outcomes: []
    })).rejects.toThrow('fail');
    expect(onError).toHaveBeenCalledWith(error);
    expect(onSettled).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
