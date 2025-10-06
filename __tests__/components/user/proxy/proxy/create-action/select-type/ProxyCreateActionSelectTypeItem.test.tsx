import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ProxyCreateActionSelectTypeItem from '@/components/user/proxy/proxy/create-action/select-type/ProxyCreateActionSelectTypeItem';
import { ApiProfileProxyActionType } from '@/generated/models/ApiProfileProxyActionType';
import { PROFILE_PROXY_ACTION_LABELS } from '@/entities/IProxy';

describe('ProxyCreateActionSelectTypeItem', () => {
  it('shows label and triggers selection', async () => {
    const setSelectedActionType = jest.fn();
    const actionType = ApiProfileProxyActionType.RateWaveDrop;
    render(
      <ProxyCreateActionSelectTypeItem
        actionType={actionType}
        setSelectedActionType={setSelectedActionType}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(PROFILE_PROXY_ACTION_LABELS[actionType]);
    await userEvent.click(button);
    expect(setSelectedActionType).toHaveBeenCalledWith(actionType);
  });
});
