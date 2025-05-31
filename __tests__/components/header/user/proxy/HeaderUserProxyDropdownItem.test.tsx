import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderUserProxyDropdownItem from '../../../../../components/header/user/proxy/HeaderUserProxyDropdownItem';

const profile = {
  id: 1,
  created_by: { handle: 'alice', pfp: 'img.png' }
};

describe('HeaderUserProxyDropdownItem', () => {
  it('activates proxy when not active', async () => {
    const activate = jest.fn();
    render(
      <HeaderUserProxyDropdownItem
        profileProxy={profile as any}
        activeProfileProxy={null}
        onActivateProfileProxy={activate}
      />
    );
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(activate).toHaveBeenCalledWith(profile);
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('deactivates proxy when active', async () => {
    const activate = jest.fn();
    render(
      <HeaderUserProxyDropdownItem
        profileProxy={profile as any}
        activeProfileProxy={profile as any}
        onActivateProfileProxy={activate}
      />
    );
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(activate).toHaveBeenCalledWith(null);
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });
});
