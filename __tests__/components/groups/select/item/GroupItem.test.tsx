import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupItem from '@/components/groups/select/item/GroupItem';
import { getScaledImageUri } from '@/helpers/image.helpers';

jest.mock('@/helpers/image.helpers', () => ({
  getScaledImageUri: jest.fn(() => 'scaled.jpg'),
  ImageScale: { W_AUTO_H_50: 'AUTOx50' },
}));

jest.mock('@/helpers/Helpers', () => ({
  getTimeAgo: jest.fn(() => '1 day ago'),
}));

describe('GroupItem', () => {
  const group: any = {
    id: 'g1',
    name: 'Group',
    created_at: new Date().toISOString(),
    created_by: { handle: 'alice', pfp: 'pic.jpg', banner1_color: '#111', banner2_color: '#222' },
  };

  it('shows remove button when active and triggers callback', async () => {
    const onActive = jest.fn();
    const user = userEvent.setup();
    render(
      <GroupItem group={group} activeGroupId="g1" onActiveGroupId={onActive} />
    );

    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onActive).toHaveBeenCalledWith(null);
  });

  it('does not render remove button when inactive', () => {
    render(<GroupItem group={group} activeGroupId={null} />);
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
  });

  it('uses scaled profile picture', () => {
    render(<GroupItem group={{ ...group, created_by: { ...group.created_by, pfp: 'img.png' } }} activeGroupId={null} />);
    const img = screen.getByAltText('Profile Picture') as HTMLImageElement;
    expect(getScaledImageUri).toHaveBeenCalledWith('img.png', expect.anything());
    expect(img.src).toContain('scaled.jpg');
  });
});
