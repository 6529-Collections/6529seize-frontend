import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import NextGenAdminSetSplits from '@/components/nextGen/admin/NextGenAdminSetSplits';

jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => ({ data: 1 }),
  getCollectionIdsForAddress: () => ['1'],
  useMinterContractWrite: () => ({ writeContract: jest.fn(), reset: jest.fn(), params: {}, isSuccess:false, isError:false }),
  useParsedCollectionIndex: () => 1,
}));

jest.mock('@/components/nextGen/admin/NextGenAdminShared', () => ({
  NextGenCollectionIdFormGroup: ({ onChange }: any) => <input data-testid="collection" onChange={e => onChange(e.target.value)} />,
  NextGenAdminHeadingRow: () => <div />,
  NextGenAdminTextFormGroup: ({ title, value, setValue }: any) => <input aria-label={title} value={value} onChange={e=>setValue(e.target.value)} />,
}));

jest.mock('@/components/nextGen/NextGenContractWriteStatus', () => () => <div />);

jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));

jest.mock('wagmi', () => ({ useReadContract: jest.fn(() => ({ data: [] })) }));

function setup() {
  return render(<NextGenAdminSetSplits close={() => {}} />);
}

test('shows validation errors when fields missing', () => {
  setup();
  fireEvent.click(screen.getByText('Submit'));
  expect(screen.getByText('Collection id is required')).toBeInTheDocument();
});
