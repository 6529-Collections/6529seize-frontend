import { render, fireEvent } from '@testing-library/react';
import GroupCreatePrivate from '../../components/groups/page/create/config/include-me-and-private/GroupCreatePrivate';

describe('GroupCreatePrivate', () => {
  it('toggles checkbox and calls callback', () => {
    const mock = jest.fn();
    const { getByRole } = render(
      <GroupCreatePrivate isPrivate={false} setIsPrivate={mock} />
    );
    const toggle = getByRole('switch');
    fireEvent.click(toggle);
    expect(mock).toHaveBeenCalledWith(true);
  });
});
