import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProxyActionRow, { PROXY_ACTION_ROW_VIEW_MODE } from '../../../../../../components/user/proxy/proxy/list/ProxyActionRow';

jest.mock('../../../../../../components/user/proxy/proxy/list/ProxyActionRowDataMode', () => ({
  __esModule: true,
  default: ({ setViewMode }: any) => <button onClick={() => setViewMode(PROXY_ACTION_ROW_VIEW_MODE.CREDIT_EDIT)}>data</button>,
}));

jest.mock('../../../../../../components/user/proxy/proxy/action/utils/credit/ProfileProxyCreditEdit', () => ({
  __esModule: true,
  default: ({ setViewMode }: any) => <button onClick={setViewMode}>credit</button>,
}));

jest.mock('../../../../../../components/user/proxy/proxy/action/utils/time/ProfileProxyEndTimeEdit', () => ({
  __esModule: true,
  default: ({ setViewMode }: any) => <button onClick={setViewMode}>time</button>,
}));

jest.mock('../../../../../../components/utils/animation/CommonChangeAnimation.tsx', () => ({ __esModule: true, default: (p:any) => <div>{p.children}</div> }));

describe('ProxyActionRow', () => {
  const baseProps = {
    action: { id: '1' } as any,
    profileProxy: {} as any,
    profile: {} as any,
    isSelf: false,
  };

  it('switches view modes when child triggers', () => {
    render(<ProxyActionRow {...baseProps} />);
    fireEvent.click(screen.getByText('data'));
    expect(screen.getByText('credit')).toBeInTheDocument();
    fireEvent.click(screen.getByText('credit'));
    expect(screen.getByText('data')).toBeInTheDocument();
  });
});
