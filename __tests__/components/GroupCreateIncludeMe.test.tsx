import { render, fireEvent } from '@testing-library/react';
import GroupCreateIncludeMe from '@/components/groups/page/create/config/include-me-and-private/GroupCreateIncludeMe';

describe('GroupCreateIncludeMe', () => {
  it('toggles checkbox and calls callback', () => {
    const mock = jest.fn();
    const { getByRole } = render(
      <GroupCreateIncludeMe iAmIncluded={false} setIAmIncluded={mock} />
    );
    const toggle = getByRole('switch');
    fireEvent.click(toggle);
    expect(mock).toHaveBeenCalledWith(true);
  });
});
