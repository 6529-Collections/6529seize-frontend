import { changeDropInCache } from '../../components/react-query-wrapper/utils/onDropRateChange';
import { QueryKey } from '../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('../../helpers/Helpers', () => ({ wait: jest.fn(() => Promise.resolve()) }));

describe('changeDropInCache', () => {
  it('updates cache and invalidates queries', async () => {
    const setQueryData = jest.fn();
    const setQueriesData = jest.fn();
    const invalidateQueries = jest.fn();

    const queryClient: any = { setQueryData, setQueriesData, invalidateQueries };

    const drop: any = { id: 'd1', author: { handle: 'user' }, wave: { id: 'w1' } };
    await changeDropInCache(queryClient, drop, 'giver');

    expect(setQueryData).toHaveBeenCalled();
    expect(setQueriesData).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledTimes(9);

    // test mutation function
    const cb = setQueryData.mock.calls[0][1];
    const result = cb({ pages: [[{ id: 'a' }, { id: 'd1' }]] });
    expect(result.pages[0][1]).toEqual(drop);
  });
});
