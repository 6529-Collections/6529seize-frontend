import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyCreateActionConfigCreateDropToWave from '@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigCreateDropToWave';
import { ApiProfileProxyActionType } from '@/generated/models/ApiProfileProxyActionType';

describe('ProxyCreateActionConfigCreateDropToWave', () => {
  it('calls callbacks on buttons', async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    render(
      <ProxyCreateActionConfigCreateDropToWave endTime={123} onSubmit={onSubmit} onCancel={onCancel} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({
      action_type: ApiProfileProxyActionType.CreateDropToWave,
      end_time: 123,
    });
  });
});
