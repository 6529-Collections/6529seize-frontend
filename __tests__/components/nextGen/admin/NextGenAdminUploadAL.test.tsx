import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import NextGenAdminUploadAL from '../../../../components/nextGen/admin/NextGenAdminUploadAL';
import { useSignMessage } from 'wagmi';
import { useSeizeConnectContext } from '../../../../components/auth/SeizeConnectContext';

jest.mock('wagmi', () => ({ useSignMessage: jest.fn() }));
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x1' }) }));
jest.mock('../../../../components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => ({}),
  useCollectionAdmin: () => ({ data: [] }),
  getCollectionIdsForAddress: () => ['1'],
  useParsedCollectionIndex: () => ([]),
}));
jest.mock('../../../../services/6529api', () => ({ postFormData: jest.fn(() => Promise.resolve({ status: 200, response: { merkle_root: 'x' } })) }));

(useSignMessage as jest.Mock).mockReturnValue({ signMessage: jest.fn(), reset: jest.fn() });

describe('NextGenAdminUploadAL', () => {
  it('changes type when selecting radio', () => {
    render(<NextGenAdminUploadAL close={() => {}} />);
    const radios = screen.getAllByRole('radio');
    // The second radio button should be "No Allowlist" based on the order in the component
    const noAl = radios[1];
    fireEvent.click(noAl);
    expect((noAl as HTMLInputElement).checked).toBe(true);
  });

  it('upload button disabled when required fields missing', () => {
    render(<NextGenAdminUploadAL close={() => {}} />);
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });
});
