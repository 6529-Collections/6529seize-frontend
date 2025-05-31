import { renderHook } from '@testing-library/react';
import { useWaveById } from '../../hooks/useWaveById';
import { useQuery } from '@tanstack/react-query';
import { commonApiFetch } from '../../services/api/common-api';
import { QueryKey } from '../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));

const useQueryMock = useQuery as jest.Mock;

beforeEach(() => {
  useQueryMock.mockReset();
});

test('calls useQuery with wave endpoint', () => {
  useQueryMock.mockReturnValue({});
  renderHook(() => useWaveById('w1'));
  expect(useQueryMock).toHaveBeenCalledWith({
    queryKey: [QueryKey.WAVE, { wave_id: 'w1' }],
    queryFn: expect.any(Function),
    enabled: true,
    staleTime: 60000,
    placeholderData: expect.any(Function),
  });
});

test('disables query when id null', () => {
  useQueryMock.mockReturnValue({});
  renderHook(() => useWaveById(null));
  expect(useQueryMock).toHaveBeenCalledWith({
    queryKey: [QueryKey.WAVE, { wave_id: null }],
    queryFn: expect.any(Function),
    enabled: false,
    staleTime: 60000,
    placeholderData: expect.any(Function),
  });
});
