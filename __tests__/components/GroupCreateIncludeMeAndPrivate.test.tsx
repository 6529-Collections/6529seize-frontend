import { render, fireEvent } from '@testing-library/react';
import GroupCreateIncludeMeAndPrivate from '../../components/groups/page/create/config/include-me-and-private/GroupCreateIncludeMeAndPrivate';

describe('GroupCreateIncludeMeAndPrivate', () => {
  it('forwards state changes from both toggles', () => {
    const onPrivate = jest.fn();
    const onInclude = jest.fn();
    const { getAllByRole } = render(
      <GroupCreateIncludeMeAndPrivate
        isPrivate={false}
        setIsPrivate={onPrivate}
        iAmIncluded={false}
        setIAmIncluded={onInclude}
      />
    );

    const switches = getAllByRole('switch');
    fireEvent.click(switches[0]);
    fireEvent.click(switches[1]);

    expect(onInclude).toHaveBeenCalledWith(true);
    expect(onPrivate).toHaveBeenCalledWith(true);
  });
});
