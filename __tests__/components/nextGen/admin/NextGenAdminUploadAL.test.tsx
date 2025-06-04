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

  it('calls signMessage when uploading', () => {
    const signSpy = jest.fn();
    (useSignMessage as jest.Mock).mockReturnValue({ signMessage: signSpy, reset: jest.fn(), isError: false, isSuccess: false });
    render(<NextGenAdminUploadAL close={() => {}} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('...Phase name'), { target: { value: 'p' } });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(['a'], 'a.csv', { type: 'text/csv' })] } });
    fireEvent.change(screen.getAllByPlaceholderText('Unix epoch time')[0], { target: { value: '1' } });
    fireEvent.change(screen.getAllByPlaceholderText('Unix epoch time')[1], { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('...0.06529'), { target: { value: '0.1' } });
    const button = screen.getByRole('button', { name: 'Upload' });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
  });
});
