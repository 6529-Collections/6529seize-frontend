import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import NextGenAdminUploadAL from '@/components/nextGen/admin/NextGenAdminUploadAL';
import { useSignTypedData } from 'wagmi';

jest.mock('wagmi', () => ({ useSignTypedData: jest.fn() }));
jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => ({ address: '0x0000000000000000000000000000000000000001' }),
}));
jest.mock('@/components/nextGen/nextgen_helpers', () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => ({}),
  useCollectionAdmin: () => ({ data: [] }),
  getCollectionIdsForAddress: () => ['1'],
  useParsedCollectionIndex: () => ([]),
}));
jest.mock('@/services/6529api', () => ({ postFormData: jest.fn(() => Promise.resolve({ status: 200, response: { merkle_root: 'x' } })) }));
jest.mock('@/services/signing/privileged-action-challenge', () => ({
  getPrivilegedActionChallenge: jest.fn(() =>
    Promise.resolve({
      nonce: 'nonce',
      expiresAt: 123,
      serverSignature: 'serverSig',
    })
  ),
}));

(useSignTypedData as jest.Mock).mockReturnValue({
  signTypedDataAsync: jest.fn(() => Promise.resolve('sig')),
  reset: jest.fn(),
});

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

  it('calls signTypedDataAsync when uploading', async () => {
    const signSpy = jest.fn(() => Promise.resolve('sig'));
    (useSignTypedData as jest.Mock).mockReturnValue({
      signTypedDataAsync: signSpy,
      reset: jest.fn(),
    });
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
    await waitFor(() => expect(signSpy).toHaveBeenCalled());
  });
});
