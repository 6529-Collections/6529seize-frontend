import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyCreateActionConfigReadWave from '@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigReadWave';
import { ApiProfileProxyActionType } from '@/generated/models/ApiProfileProxyActionType';

describe('ProxyCreateActionConfigReadWave', () => {
  it('calls callbacks on buttons', async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    render(<ProxyCreateActionConfigReadWave endTime={2} onSubmit={onSubmit} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ action_type: ApiProfileProxyActionType.ReadWave, end_time: 2 });
  });
});
