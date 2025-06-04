import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserSettingsClassification from '../../../../components/user/settings/UserSettingsClassification';
import { ApiProfileClassification } from '../../../../generated/models/ApiProfileClassification';
import { CLASSIFICATIONS } from '../../../../entities/IProfile';

describe('UserSettingsClassification', () => {
  it('opens menu and selects new classification', async () => {
    const onSelect = jest.fn();
    render(
      <UserSettingsClassification
        selected={ApiProfileClassification.Ai}
        onSelect={onSelect}
      />
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveTextContent(CLASSIFICATIONS[ApiProfileClassification.Ai].title);
    await userEvent.click(toggle);
    const option = await screen.findByText(CLASSIFICATIONS[ApiProfileClassification.Pseudonym].title);
    await userEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith(ApiProfileClassification.Pseudonym);
  });
});
