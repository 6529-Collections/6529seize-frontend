import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSettingsUsername from '../../../../components/user/settings/UserSettingsUsername';

jest.mock('react-use', () => {
  const React = require('react');
  return {
    useDebounce: (fn: () => void, _delay: number, deps: any[]) => React.useEffect(fn, deps),
  };
});

jest.mock('../../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

const { commonApiFetch } = require('../../../../services/api/common-api');

describe('UserSettingsUsername', () => {
  it('checks username availability on change', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({ available: true, message: 'ok' });
    const setUserName = jest.fn();
    const setIsAvailable = jest.fn();
    const setIsLoading = jest.fn();
    render(
      <UserSettingsUsername
        userName="alice"
        originalUsername="bob"
        setUserName={setUserName}
        setIsAvailable={setIsAvailable}
        setIsLoading={setIsLoading}
      />
    );

    await userEvent.type(screen.getByRole('textbox'), '1');
    expect(setUserName).toHaveBeenLastCalledWith('alice1');

    await waitFor(() => expect(commonApiFetch).toHaveBeenCalled());
    expect(setIsAvailable).toHaveBeenCalledWith(true);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
