import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyCreateActionConfigCreateWave from '../../../../../../../components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigCreateWave';
import { ApiProfileProxyActionType } from '../../../../../../../generated/models/ApiProfileProxyActionType';

describe('ProxyCreateActionConfigCreateWave', () => {
  it('calls callbacks on buttons', async () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    render(<ProxyCreateActionConfigCreateWave endTime={1} onSubmit={onSubmit} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ action_type: ApiProfileProxyActionType.CreateWave, end_time: 1 });
  });
});
