import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupItemWrapper from '../../../../../components/groups/select/item/GroupItemWrapper';

jest.mock('../../../../../helpers/Helpers', () => ({
  getRandomColorWithSeed: jest.fn(() => '#123456'),
}));

describe('GroupItemWrapper', () => {
  const group: any = {
    id: 'g1',
    created_by: { handle: 'john', banner1_color: '#111', banner2_color: '#222' },
  };

  it('invokes onActiveGroupId when inactive', async () => {
    const onActive = jest.fn();
    render(
      <GroupItemWrapper group={group} isActive={false} deactivateHover={false} onActiveGroupId={onActive}>
        <span>child</span>
      </GroupItemWrapper>
    );
    await userEvent.click(screen.getByText('child'));
    expect(onActive).toHaveBeenCalledWith('g1');
  });

  it('does not invoke onActiveGroupId when active', async () => {
    const onActive = jest.fn();
    render(
      <GroupItemWrapper group={group} isActive={true} deactivateHover={false} onActiveGroupId={onActive}>
        <span>child</span>
      </GroupItemWrapper>
    );
    await userEvent.click(screen.getByText('child'));
    expect(onActive).not.toHaveBeenCalled();
  });

  it('uses banner colors for gradient', () => {
    render(
      <GroupItemWrapper group={group} isActive={false} deactivateHover={false}>
        <span>child</span>
      </GroupItemWrapper>
    );
    const childElement = screen.getByText('child');
    const containerDiv = childElement.closest('div[class*="tw-bg-iron-900"]');
    const gradientDiv = containerDiv?.querySelector('div[class*="tw-h-7"]') as HTMLElement;
    expect(gradientDiv).toHaveStyle(`background: linear-gradient(45deg, #111 0%, #222 100%)`);
  });
});
