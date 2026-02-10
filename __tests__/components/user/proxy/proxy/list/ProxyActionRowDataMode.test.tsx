import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import ProxyActionRowDataMode from '@/components/user/proxy/proxy/list/ProxyActionRowDataMode';
import { PROXY_ACTION_ROW_VIEW_MODE } from '@/components/user/proxy/proxy/list/ProxyActionRow';
import { ApiProfileProxyActionType } from '@/generated/models/ApiProfileProxyActionType';
import { PROFILE_PROXY_ACTION_LABELS } from '@/entities/IProxy';

jest.mock('@/helpers/profile-proxy.helpers', () => ({
  getProfileProxyActionStatus: jest.fn(() => 'status'),
}));

jest.mock('@/helpers/Helpers', () => ({
  getTimeAgo: jest.fn(() => 'time'),
}));

jest.mock('@/components/user/proxy/proxy/list/ProxyActionRowStatus', () => (props: any) => (
  <div data-testid={`status-${props.side}`}>{props.status}</div>
));

jest.mock('@/components/user/proxy/proxy/action/utils/credit/ProfileProxyCredit', () => (props: any) => (
  <button data-testid="credit" onClick={props.onCreditEdit}>credit</button>
));

jest.mock('@/components/user/proxy/proxy/action/utils/time/ProfileProxyEndTime', () => (props: any) => (
  <button data-testid="end" onClick={props.onEndTimeEdit}>end</button>
));

jest.mock('@/components/user/proxy/proxy/action/ProxyActionAcceptanceButton', () => () => (
  <div data-testid="accept" />
));

function renderComp(isSelf = false, actionType = ApiProfileProxyActionType.AllocateRep) {
  const action: any = { action_type: actionType, created_at: 1 };
  const proxy: any = { created_by: {}, granted_to: {} };
  const profile: any = {};
  const setViewMode = jest.fn();
  render(
    <ProxyActionRowDataMode
      action={action}
      profileProxy={proxy}
      profile={profile}
      isSelf={isSelf}
      setViewMode={setViewMode}
    />
  );
  return setViewMode;
}

test('renders labels and statuses', () => {
  renderComp();
  expect(screen.getByText(PROFILE_PROXY_ACTION_LABELS[ApiProfileProxyActionType.AllocateRep])).toBeInTheDocument();
  expect(screen.getByTestId('status-GRANTED')).toHaveTextContent('status');
  expect(screen.getByTestId('status-RECEIVED')).toHaveTextContent('status');
  expect(screen.getByTestId('credit')).toBeInTheDocument();
  expect(screen.getByText('time')).toBeInTheDocument();
});

test('calls setViewMode on credit and end edits', () => {
  const set = renderComp();
  fireEvent.click(screen.getByTestId('credit'));
  expect(set).toHaveBeenCalledWith(PROXY_ACTION_ROW_VIEW_MODE.CREDIT_EDIT);
  fireEvent.click(screen.getByTestId('end'));
  expect(set).toHaveBeenCalledWith(PROXY_ACTION_ROW_VIEW_MODE.END_TIME_EDIT);
});

test('shows acceptance button only for self', () => {
  renderComp(true);
  expect(screen.getByTestId('accept')).toBeInTheDocument();
});

test('omits credit section when action has no credit', () => {
  renderComp(false, ApiProfileProxyActionType.CreateWave);
  expect(screen.queryByTestId('credit')).toBeNull();
});
