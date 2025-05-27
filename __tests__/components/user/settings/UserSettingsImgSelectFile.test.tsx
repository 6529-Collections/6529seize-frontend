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
});
