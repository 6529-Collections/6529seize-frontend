import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserSettingsImgSelectFile from '../../../../components/user/settings/UserSettingsImgSelectFile';
import { AuthContext } from '../../../../components/auth/Auth';

const setToast = jest.fn();
const setFile = jest.fn();
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={{ setToast } as any}>{children}</AuthContext.Provider>
);

describe('UserSettingsImgSelectFile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });


  it('accepts valid file', async () => {
    const { container } = render(<UserSettingsImgSelectFile imageToShow={null} setFile={setFile} />, { wrapper: Wrapper });
    const input = container.querySelector('#pfp-upload-input') as HTMLInputElement;
    const file = new File(['123'], 'file.png', { type: 'image/png' });
    await userEvent.upload(input, file);
    expect(setFile).toHaveBeenCalledWith(file);
  });

  it('shows error for large files', async () => {
    const { container, findByText } = render(<UserSettingsImgSelectFile imageToShow={null} setFile={setFile} />, { wrapper: Wrapper });
    const input = container.querySelector('#pfp-upload-input') as HTMLInputElement;
    const bigFile = new File(['a'.repeat(10)], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 3000000 });
    await userEvent.upload(input, bigFile);
    expect(await findByText('File size must be less than 2MB')).toBeInTheDocument();
    expect(setFile).not.toHaveBeenCalled();
  });
});
