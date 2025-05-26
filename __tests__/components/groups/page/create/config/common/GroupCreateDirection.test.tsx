import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateDirection from '../../../../../../../components/groups/page/create/config/common/GroupCreateDirection';
import { ApiGroupFilterDirection } from '../../../../../../../generated/models/ApiGroupFilterDirection';

describe('GroupCreateDirection', () => {
  it('renders direction tabs', () => {
    const setDirection = jest.fn();
    render(
      <GroupCreateDirection
        direction={ApiGroupFilterDirection.Sent}
        label="Identity"
        setDirection={setDirection}
      />
    );
    expect(screen.getByRole('button', { name: 'Identity to' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Identity from' })).toBeInTheDocument();
  });

  it('calls setDirection when selecting a tab', async () => {
    const user = userEvent.setup();
    const setDirection = jest.fn();
    render(
      <GroupCreateDirection
        direction={ApiGroupFilterDirection.Sent}
        label="Identity"
        setDirection={setDirection}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Identity from' }));
    expect(setDirection).toHaveBeenCalledWith(ApiGroupFilterDirection.Received);
  });
});
