import { getParams, getReadParams, getActiveDelegationsReadParams, getConsolidationReadParams, formatExpiry, getDelegationsFromData } from '../../../components/delegation/CollectionDelegation';
import { DELEGATION_CONTRACT, NEVER_DATE } from '../../../constants';
import { DELEGATION_ABI } from '../../../abis';
import { PRIMARY_ADDRESS_USE_CASE, SUB_DELEGATION_USE_CASE, CONSOLIDATION_USE_CASE, DELEGATION_USE_CASES } from '../../../pages/delegation/[...section]';

describe('CollectionDelegation utility functions', () => {
  it('builds params with extra use cases', () => {
    const res = getParams('0x1','0x2','fn',[{ use_case: 1 }]);
    expect(res[0]).toEqual({
      address: DELEGATION_CONTRACT.contract,
      abi: DELEGATION_ABI,
      chainId: DELEGATION_CONTRACT.chain_id,
      functionName: 'fn',
      args: ['0x1','0x2',1]
    });
    // includes predefined use cases
    const codes = res.slice(1).map(p => p.args[2]);
    expect(codes).toEqual([
      PRIMARY_ADDRESS_USE_CASE.use_case,
      SUB_DELEGATION_USE_CASE.use_case,
      CONSOLIDATION_USE_CASE.use_case
    ]);
  });

  it('getReadParams defaults to DELEGATION_USE_CASES', () => {
    const res = getReadParams('0x1','0x2','fn');
    expect(res.length).toBe(DELEGATION_USE_CASES.length + 3);
  });

  it('getActiveDelegationsReadParams uses provided use cases', () => {
    const res = getActiveDelegationsReadParams('0x1','0x2','fn');
    expect(res.length).toBe(DELEGATION_USE_CASES.length + 3);
  });

  it('getConsolidationReadParams returns params for wallets', () => {
    const res = getConsolidationReadParams('0x1','0x2',{ wallets: [{ wallet: '0x3' }] } as any);
    expect(res[0].args).toEqual(['0x1','0x3','0x2']);
  });

  it('formatExpiry formats unix timestamp', () => {
    const ts = Date.UTC(2024,0,2)/1000; // 2024-01-02
    expect(formatExpiry(ts)).toBe('2024-01-02');
  });

  it('getDelegationsFromData parses delegations', () => {
    const data = [{ result: [['0x4'], [NEVER_DATE+1], [true], [1]] }];
    const res = getDelegationsFromData(data);
    expect(res[0].wallets[0].expiry).toContain('active - non-expiring');
  });

  it('returns empty when no result present', () => {
    const res = getDelegationsFromData([{ result: null } as any]);
    expect(res).toEqual([]);
  });

  it('marks expired delegations correctly', () => {
    const past = Math.floor(Date.now()/1000) - 100;
    const data = [{ result: [['0x1'], [past], [false], [1]] }];
    const res = getDelegationsFromData(data);
    expect(res[0].wallets[0].expiry).toContain('expired');
  });
});
