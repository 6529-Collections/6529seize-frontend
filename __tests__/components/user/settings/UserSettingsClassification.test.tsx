import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserSettingsClassification from '@/components/user/settings/UserSettingsClassification';
import { ApiProfileClassification } from '@/generated/models/ApiProfileClassification';
import { CLASSIFICATIONS } from '@/entities/IProfile';

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
    expect(toggle).not.toHaveAttribute('aria-controls');
    await userEvent.click(toggle);
    const optionsId = toggle.getAttribute('aria-controls');
    expect(optionsId).not.toBeNull();
    expect(document.getElementById(optionsId!)).toBeInTheDocument();
    const option = await screen.findByRole('button', {
      name: CLASSIFICATIONS[ApiProfileClassification.Pseudonym].title,
    });
    await userEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith(ApiProfileClassification.Pseudonym);
    expect(toggle).toHaveFocus();
    expect(toggle).not.toHaveAttribute('aria-controls');
  });
});
