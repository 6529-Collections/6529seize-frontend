import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ProxyCreateActionConfig from '@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfig';
import { ApiProfileProxyActionType } from '@/generated/models/ApiProfileProxyActionType';

jest.mock('@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigEndTimeSwitch', () => ({
  __esModule: true,
  default: (props: any) => <button data-testid="switch" onClick={() => props.setIsActive(!props.isActive)} />,
}));

jest.mock('@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigCreateWave', () => ({
  __esModule: true,
  default: (props: any) => <button data-testid="create-wave" onClick={() => props.onSubmit({ end_time: props.endTime, type: 'wave' })} />,
}));

jest.mock('@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigAllocateRep', () => ({
  __esModule: true,
  default: (props: any) => <button data-testid="allocate-rep" onClick={() => props.onSubmit({ end_time: props.endTime, type: 'rep' })} />,
}));

jest.mock('@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigAllocateCic', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigReadWave', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigCreateDropToWave', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfigRateWaveDrop', () => ({ __esModule: true, default: () => null }));

jest.mock('@/components/utils/time/CommonTimeSelect', () => ({
  __esModule: true,
  default: (props: any) => <button data-testid="time-select" onClick={() => props.onMillis(123)} />,
}));

describe('ProxyCreateActionConfig', () => {
  it('passes null end_time when disabled', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <ProxyCreateActionConfig
        selectedActionType={ApiProfileProxyActionType.CreateWave}
        submitting={false}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );
    await user.click(screen.getByTestId('create-wave'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ end_time: null }));
  });

  it('includes end_time when enabled', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <ProxyCreateActionConfig
        selectedActionType={ApiProfileProxyActionType.AllocateRep}
        submitting={false}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );
    await user.click(screen.getByTestId('switch'));
    await user.click(screen.getByTestId('time-select'));
    await user.click(screen.getByTestId('allocate-rep'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ end_time: 123 }));
  });
});
