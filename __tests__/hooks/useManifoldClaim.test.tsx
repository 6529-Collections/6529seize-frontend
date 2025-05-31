import { renderHook, waitFor } from '@testing-library/react';
import useManifoldClaim, { ManifoldClaimStatus, ManifoldPhase } from '../../hooks/useManifoldClaim';
import { NULL_MERKLE } from "../../constants";
import { useReadContract } from 'wagmi';

jest.mock('wagmi', () => ({ useReadContract: jest.fn() }));

const mockRead = useReadContract as jest.Mock;

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(150 * 1000);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('builds claim from contract data', async () => {
  mockRead.mockReturnValue({
    data: [3n, { total: 1n, totalMax: 2n, cost: 0n, startDate: 100n, endDate: 200n, merkleRoot: NULL_MERKLE }],
    isFetching: false,
    error: null,
  });
  const { result } = renderHook(() => useManifoldClaim('0x1','0x2',[],1));
  await waitFor(() => expect(result.current).toBeDefined());
  expect(result.current?.status).toBe(ManifoldClaimStatus.ACTIVE);
  expect(result.current?.phase).toBe(ManifoldPhase.PUBLIC);
  expect(result.current?.remaining).toBe(1);
});
