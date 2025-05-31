import { getParams, getReadParams, getActiveDelegationsReadParams, getConsolidationReadParams, formatExpiry, getDelegationsFromData } from '../../../components/delegation/CollectionDelegation';
import { DELEGATION_CONTRACT } from '../../../constants';
import { DELEGATION_USE_CASES, PRIMARY_ADDRESS_USE_CASE, SUB_DELEGATION_USE_CASE, CONSOLIDATION_USE_CASE } from '../../../pages/delegation/[...section]';

const functionName = 'fn';

describe('CollectionDelegation utility functions', () => {
  it('getParams builds parameter list', () => {
    const params = getParams('0x1', '0x2', functionName, [{ use_case: 1 }]);
    expect(params[0]).toEqual({
      address: DELEGATION_CONTRACT.contract,
      abi: expect.anything(),
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName,
      args: ['0x1', '0x2', 1],
    });
    expect(params).toHaveLength(4);
    expect(params[1].args[2]).toBe(PRIMARY_ADDRESS_USE_CASE.use_case);
    expect(params[2].args[2]).toBe(SUB_DELEGATION_USE_CASE.use_case);
    expect(params[3].args[2]).toBe(CONSOLIDATION_USE_CASE.use_case);
  });

  it('getReadParams uses DELEGATION_USE_CASES when undefined', () => {
    const params = getReadParams('a', 'b', functionName);
    expect(params).toHaveLength(DELEGATION_USE_CASES.length + 3);
  });

  it('getActiveDelegationsReadParams always uses DELEGATION_USE_CASES', () => {
    const params = getActiveDelegationsReadParams('a', 'b', functionName);
    expect(params).toHaveLength(DELEGATION_USE_CASES.length + 3);
  });

  it('getConsolidationReadParams returns entries for each wallet', () => {
    const params = getConsolidationReadParams('a', 'c', { wallets: [{ wallet: 'w1' }, { wallet: 'w2' }] } as any);
    expect(params).toHaveLength(2);
    expect(params[0].args).toEqual(['a', 'w1', 'c']);
  });

  it('formatExpiry converts epoch to yyyy-mm-dd', () => {
    expect(formatExpiry('1700000000')).toBe('2023-11-14');
  });

  it('getDelegationsFromData parses contract data', () => {
    const now = Math.floor(Date.now() / 1000) + 1000;
    const data = [{ result: [['0x1'], [now], [true], [0]] }];
    const res = getDelegationsFromData(data as any);
    expect(res[0].useCase).toEqual(DELEGATION_USE_CASES[0]);
    expect(res[0].wallets[0].wallet).toBe('0x1');
    expect(res[0].wallets[0].expiry).toContain('active - expires');
  });
});
