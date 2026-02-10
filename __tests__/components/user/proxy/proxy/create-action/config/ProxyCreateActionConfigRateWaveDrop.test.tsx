import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ProxyCreateActionConfigRateWaveDrop from '@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigRateWaveDrop';
import { ApiProfileProxyActionType } from '@/generated/models/ApiProfileProxyActionType';

describe('ProxyCreateActionConfigRateWaveDrop', () => {
  it('submits rate wave drop action', async () => {
    const onSubmit = jest.fn();
    render(
      <ProxyCreateActionConfigRateWaveDrop endTime={42} onSubmit={onSubmit} onCancel={() => {}} />
    );
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      action_type: ApiProfileProxyActionType.RateWaveDrop,
      end_time: 42,
    });
  });

  it('handles cancel click', async () => {
    const onCancel = jest.fn();
    render(
      <ProxyCreateActionConfigRateWaveDrop endTime={null} onSubmit={() => {}} onCancel={onCancel} />
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
